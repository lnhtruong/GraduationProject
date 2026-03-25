/**
 * Generic CRUD Hooks Factory
 * Creates complete CRUD hooks from an API object
 */

import { useQuery } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
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
    onSuccess?: (data: TItem) => void;
    onError?: (error: Error) => void;
  }) {
    return useCreateBase(opts);
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
    onSuccess?: (data: TItem) => void;
    onError?: (error: Error) => void;
  }) {
    return useUpdateBase(opts);
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
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
  }) {
    return useDeleteBase(opts);
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
