/**
 * Generic CRUD Hooks Factory
 * Creates complete CRUD hooks from an API object
 */

import { useQuery } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { apiHttpClient, createApi } from "./api";
import { createMutationHooks } from "./hooks";

// ============================================================================
// TYPES
// ============================================================================

type CrudId = string | number;

export interface CrudApi<
  TItem,
  TCreate,
  TUpdate,
  TId extends CrudId = CrudId,
  TParentId extends CrudId = TId,
  TListParams = unknown,
> {
  list?: (params?: TListParams) => Promise<TItem[]>;
  listByParent?: (parentId: TParentId) => Promise<TItem[]>;
  getOne: (id: TId) => Promise<TItem>;
  create: (data: TCreate) => Promise<TItem>;
  update: (id: TId, data: TUpdate) => Promise<TItem>;
  delete: (id: TId) => Promise<unknown>;
}

export interface CrudHooksOptions<TItem extends object> {
  /** Field name for item ID (default: 'id') */
  idField?: keyof TItem | string;

  /** Query key segment for parent list queries */
  parentListKey?: string;

  /** Cache time configuration */
  listStaleTimeMs?: number;
  detailStaleTimeMs?: number;

  /** Optional side effects */
  onSuccess?: {
    list?: (data: TItem[]) => void;
    create?: (data: TItem) => void;
    update?: (data: TItem) => void;
    delete?: (data: unknown) => void;
  };
}

export interface ResourceApiConfig<
  TRaw,
  TItem,
  TId extends CrudId = CrudId,
  TListParams = unknown,
> {
  basePath: string;
  mapItem: (raw: TRaw) => TItem;
  getListPath?: (params?: TListParams) => string;
  getOnePath?: (id: TId) => string;
  getUpdatePath?: (id: TId) => string;
  getDeletePath?: (id: TId) => string;
  updateMethod?: "patch" | "put";
}

export function createResourceApi<
  TRaw,
  TItem,
  TCreate,
  TUpdate,
  TId extends CrudId = CrudId,
  TListParams = unknown,
  TDeleteResponse = unknown,
>(
  config: ResourceApiConfig<
    TRaw,
    TItem,
    TId,
    TListParams
  >,
): CrudApi<TItem, TCreate, TUpdate, TId, TId, TListParams> & {
  delete: (id: TId) => Promise<TDeleteResponse>;
} {
  const {
    basePath,
    mapItem,
    getListPath = () => `${basePath}`,
    getOnePath = (id) => `${basePath}/${id}`,
    getUpdatePath = (id) => `${basePath}/${id}`,
    getDeletePath = (id) => `${basePath}/${id}`,
    updateMethod = "patch",
  } = config;

  return createApi({
    list: async (params?: TListParams) => {
      const { data } = await apiHttpClient.get<TRaw[]>(getListPath(params));
      return data.map(mapItem);
    },
    getOne: async (id: TId) => {
      const { data } = await apiHttpClient.get<TRaw>(getOnePath(id));
      return mapItem(data);
    },
    create: async (payload: TCreate) => {
      const { data } = await apiHttpClient.post<TRaw>(`${basePath}`, payload);
      return mapItem(data);
    },
    update: async (id: TId, payload: TUpdate) => {
      const request =
        updateMethod === "put"
          ? apiHttpClient.put<TRaw>(getUpdatePath(id), payload)
          : apiHttpClient.patch<TRaw>(getUpdatePath(id), payload);

      const { data } = await request;
      return mapItem(data);
    },
    delete: async (id: TId) => {
      const { data } = await apiHttpClient.delete<TDeleteResponse>(getDeletePath(id));
      return data;
    },
  });
}

function getItemId<TItem extends object>(
  item: TItem,
  idField: keyof TItem | string,
): CrudId | undefined {
  const value = (item as Record<string, unknown>)[idField as string];
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  return undefined;
}

// ============================================================================
// CRUD HOOKS FACTORY
// ============================================================================

export function createCrudHooks<
  TItem extends object,
  TCreate,
  TUpdate,
  TId extends CrudId = CrudId,
  TParentId extends CrudId = TId,
  TListParams = unknown,
>(
  resource: string,
  api: CrudApi<TItem, TCreate, TUpdate, TId, TParentId, TListParams>,
  options: CrudHooksOptions<TItem> = {},
) {
  const {
    idField = "id",
    parentListKey = "parent",
    listStaleTimeMs = 5 * 60 * 1000,
    detailStaleTimeMs = 60 * 1000,
    onSuccess,
  } = options;
  const keys = createKeyFactory(resource);

  // =========================================================================
  // LIST QUERIES
  // =========================================================================

  function useList(params?: TListParams, enabled = true) {
    return useQuery({
      queryKey: keys.list(params ?? {}),
      queryFn: async () => {
        const data = api.list ? await api.list(params) : [];
        onSuccess?.list?.(data);
        return data;
      },
      enabled: enabled && !!api.list,
      staleTime: listStaleTimeMs,
    });
  }

  function useListByParent(parentId: TParentId | null, enabled = true) {
    return useQuery({
      queryKey: keys.custom(parentListKey, parentId),
      queryFn: async () => {
        const data = api.listByParent
          ? await api.listByParent(parentId as TParentId)
          : [];
        onSuccess?.list?.(data);
        return data;
      },
      enabled:
        enabled &&
        parentId !== null &&
        parentId !== undefined &&
        !!api.listByParent,
      staleTime: listStaleTimeMs,
    });
  }

  // =========================================================================
  // DETAIL QUERY
  // =========================================================================

  function useDetail(id: TId | null, enabled = true) {
    return useQuery({
      queryKey: keys.detail(id as TId),
      queryFn: () => api.getOne(id as TId),
      enabled: enabled && id !== null && id !== undefined,
      staleTime: detailStaleTimeMs,
    });
  }

  // =========================================================================
  // CREATE MUTATION
  // =========================================================================

  const useCreateBase = createMutationHooks<TItem, TCreate>(
    resource,
    "create",
    api.create,
    {
      retry: false,
      onSuccess: (data, _variables, qc) => {
        qc.invalidateQueries({ queryKey: keys.root });
        onSuccess?.create?.(data);
      },
    },
  );

  function useCreate(opts?: {
    onSuccess?: (data: TItem, variables: TCreate) => void;
    onError?: (error: Error) => void;
  }) {
    return useCreateBase({
      onSuccess: (data, variables) => opts?.onSuccess?.(data, variables),
      onError: opts?.onError,
    });
  }

  // =========================================================================
  // UPDATE MUTATION
  // =========================================================================

  const useUpdateBase = createMutationHooks<TItem, { id: TId; data: TUpdate }>(
    resource,
    "update",
    ({ id, data }) => api.update(id, data),
    {
      retry: false,
      onSuccess: (data, variables, qc) => {
        const itemId =
          (getItemId(data, idField) as TId | undefined) ?? variables.id;
        qc.invalidateQueries({ queryKey: keys.detail(itemId) });
        qc.invalidateQueries({ queryKey: keys.root });
        onSuccess?.update?.(data);
      },
    },
  );

  function useUpdate(opts?: {
    onSuccess?: (data: TItem, variables: { id: TId; data: TUpdate }) => void;
    onError?: (error: Error) => void;
  }) {
    return useUpdateBase({
      onSuccess: (data, variables) => opts?.onSuccess?.(data, variables),
      onError: opts?.onError,
    });
  }

  // =========================================================================
  // DELETE MUTATION
  // =========================================================================

  const useDeleteBase = createMutationHooks<unknown, TId>(
    resource,
    "delete",
    api.delete,
    {
      retry: false,
      onSuccess: (data, id, qc) => {
        qc.invalidateQueries({ queryKey: keys.detail(id) });
        qc.invalidateQueries({ queryKey: keys.root });
        onSuccess?.delete?.(data);
      },
    },
  );

  function useDelete(opts?: {
    onSuccess?: (data: unknown, id: TId) => void;
    onError?: (error: Error) => void;
  }) {
    return useDeleteBase({
      onSuccess: (data, id) => opts?.onSuccess?.(data, id),
      onError: opts?.onError,
    });
  }

  // =========================================================================
  // RETURN ALL HOOKS
  // =========================================================================

  return {
    keys,

    // Queries
    useList,
    useListByParent,
    useDetail,

    // Mutations
    useCreate,
    useUpdate,
    useDelete,
  };
}
