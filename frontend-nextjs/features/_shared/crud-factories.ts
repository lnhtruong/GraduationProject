/**
 * Generic CRUD Hooks Factory
 * Creates complete CRUD hooks from an API object
 */

import { useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { apiHttpClient, createApi } from "./api-factories";
import { createMutationHooks } from "./react-query-factories";

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
  TDelete = unknown,
> {
  list?: (params?: TListParams) => Promise<TItem[]>;
  listPaginated?: (params?: TListParams) => Promise<PaginatedResponse<TItem>>;
  listByParent?: (parentId: TParentId) => Promise<TItem[]>;
  getOne: (id: TId) => Promise<TItem>;
  create: (data: TCreate) => Promise<TItem>;
  update: (id: TId, data: TUpdate) => Promise<TItem>;
  updatePatch?: (id: TId, data: TUpdate) => Promise<TItem>;
  delete: (id: TId) => Promise<TDelete>;
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

  /** Build list params from parentId when API does not implement listByParent */
  parentListParamsBuilder?: (parentId: CrudId) => unknown;
}

// ============================================================================
// RESOURCE API FACTORY
// ============================================================================

export interface ResourceApiConfig<
  TRaw,
  TItem,
  TCreate = unknown,
  TUpdate = unknown,
  TListResponse = TRaw[],
  TId extends CrudId = CrudId,
  TListParams = unknown,
> {
  basePath: string;
  mapItem: (raw: TRaw) => TItem;
  mapListResponse?: (raw: TListResponse) => TItem[];
  mapPaginatedResponse?: (
    raw: TListResponse,
    params?: TListParams,
  ) => PaginatedResponse<TItem>;
  toCreatePayload?: (payload: TCreate) => unknown;
  toUpdatePayload?: (payload: TUpdate) => unknown;
  toPatchPayload?: (payload: TUpdate) => unknown;
  getCreatePath?: (payload: TCreate) => string;
  getListPath?: (params?: TListParams) => string;
  getOnePath?: (id: TId) => string;
  getUpdatePath?: (id: TId) => string;
  getDeletePath?: (id: TId) => string;
  updateMethod?: "patch" | "put";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<TItem> {
  data: TItem[];
  pagination: PaginationMeta;
}

type PaginatedEnvelope<TItem> = {
  data?: TItem[];
  pagination?: Partial<PaginationMeta>;
};

export function normalizePaginatedResponse<TItem>(
  raw: PaginatedEnvelope<TItem> | TItem[],
  params?: { page?: number; limit?: number },
): PaginatedResponse<TItem> {
  if (Array.isArray(raw)) {
    const fallbackLimit = params?.limit ?? raw.length;
    return {
      data: raw,
      pagination: {
        page: params?.page ?? 1,
        limit: fallbackLimit,
        totalItems: raw.length,
        totalPages: 1,
      },
    };
  }

  const items = raw.data ?? [];
  const fallbackLimit = params?.limit ?? items.length;

  return {
    data: items,
    pagination: {
      page: raw.pagination?.page ?? params?.page ?? 1,
      limit: raw.pagination?.limit ?? fallbackLimit,
      totalItems: raw.pagination?.totalItems ?? items.length,
      totalPages: raw.pagination?.totalPages ?? 1,
    },
  };
}

export function createPaginatedListApi<TItem, TListParams>(
  getPath: (params?: TListParams) => string,
) {
  return {
    getPaginated: async (
      params?: TListParams & { page?: number; limit?: number },
    ) => {
      const { data } = await apiHttpClient.get<
        PaginatedEnvelope<TItem> | TItem[]
      >(getPath(params));

      return normalizePaginatedResponse<TItem>(data, {
        page: params?.page,
        limit: params?.limit,
      });
    },
  };
}

export function buildQueryString(
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

export function withQueryPath(
  basePath: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  const query = buildQueryString(params);
  return query ? `${basePath}?${query}` : basePath;
}

export function createResourceApi<
  TRaw,
  TItem,
  TCreate,
  TUpdate,
  TId extends CrudId = CrudId,
  TListParams = unknown,
  TDeleteResponse = unknown,
  TListResponse = TRaw[],
>(
  config: ResourceApiConfig<
    TRaw,
    TItem,
    TCreate,
    TUpdate,
    TListResponse,
    TId,
    TListParams
  >,
): CrudApi<TItem, TCreate, TUpdate, TId, TId, TListParams, TDeleteResponse> {
  const {
    basePath,
    mapItem,
    mapListResponse,
    mapPaginatedResponse,
    toCreatePayload,
    toUpdatePayload,
    toPatchPayload,
    getCreatePath = () => `${basePath}`,
    getListPath = () => `${basePath}`,
    getOnePath = (id) => `${basePath}/${id}`,
    getUpdatePath = (id) => `${basePath}/${id}`,
    getDeletePath = (id) => `${basePath}/${id}`,
    updateMethod = "patch",
  } = config;

  const mapListItems = (data: TListResponse): TItem[] => {
    if (mapListResponse) return mapListResponse(data);
    return (data as unknown as TRaw[]).map(mapItem);
  };

  const getPageLimitParams = (
    params?: TListParams,
  ): { page?: number; limit?: number } => {
    if (!params || typeof params !== "object") return {};

    const raw = params as Record<string, unknown>;
    return {
      page: typeof raw.page === "number" ? raw.page : undefined,
      limit: typeof raw.limit === "number" ? raw.limit : undefined,
    };
  };

  return createApi({
    list: async (params?: TListParams) => {
      const { data } = await apiHttpClient.get<TListResponse>(
        getListPath(params),
      );
      return mapListItems(data);
    },
    listPaginated: async (params?: TListParams) => {
      const { data } = await apiHttpClient.get<TListResponse>(
        getListPath(params),
      );

      if (mapPaginatedResponse) {
        return mapPaginatedResponse(data, params);
      }

      const pagingParams = getPageLimitParams(params);
      if (Array.isArray(data)) {
        return normalizePaginatedResponse(mapListItems(data), pagingParams);
      }

      const envelope = data as unknown as PaginatedEnvelope<TRaw>;
      if (Array.isArray(envelope?.data)) {
        return normalizePaginatedResponse(
          {
            data: envelope.data.map(mapItem),
            pagination: envelope.pagination,
          },
          pagingParams,
        );
      }

      return normalizePaginatedResponse(mapListItems(data), pagingParams);
    },
    getOne: async (id: TId) => {
      const { data } = await apiHttpClient.get<TRaw>(getOnePath(id));
      return mapItem(data);
    },
    create: async (payload: TCreate) => {
      const body = toCreatePayload ? toCreatePayload(payload) : payload;
      const { data } = await apiHttpClient.post<TRaw>(
        getCreatePath(payload),
        body,
      );
      return mapItem(data);
    },
    update: async (id: TId, payload: TUpdate) => {
      const body = toUpdatePayload ? toUpdatePayload(payload) : payload;
      const request =
        updateMethod === "put"
          ? apiHttpClient.put<TRaw>(getUpdatePath(id), body)
          : apiHttpClient.patch<TRaw>(getUpdatePath(id), body);

      const { data } = await request;
      return mapItem(data);
    },
    updatePatch: async (id: TId, payload: TUpdate) => {
      const body = toPatchPayload ? toPatchPayload(payload) : payload;
      const { data } = await apiHttpClient.patch<TRaw>(getUpdatePath(id), body);
      return mapItem(data);
    },
    delete: async (id: TId) => {
      const { data } = await apiHttpClient.delete<TDeleteResponse>(
        getDeletePath(id),
      );
      return data;
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
  TDelete = unknown,
>(
  resource: string,
  api: CrudApi<TItem, TCreate, TUpdate, TId, TParentId, TListParams, TDelete>,
  options: CrudHooksOptions<TItem> & {
    onSuccess?: {
      list?: (data: TItem[]) => void;
      create?: (data: TItem) => void;
      update?: (data: TItem) => void;
      delete?: (data: TDelete) => void;
    };
  } = {},
) {
  const {
    idField = "id",
    parentListKey = "parent",
    parentListParamsBuilder,
    listStaleTimeMs = 5 * 60 * 1000,
    detailStaleTimeMs = 60 * 1000,
    onSuccess,
  } = options;
  const keys = createKeyFactory(resource);

  const invalidateResource = (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: keys.root });
  };

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
          : api.list && parentListParamsBuilder
            ? await api.list(
                parentListParamsBuilder(
                  parentId as unknown as CrudId,
                ) as TListParams,
              )
            : [];
        onSuccess?.list?.(data);
        return data;
      },
      enabled:
        enabled &&
        parentId !== null &&
        parentId !== undefined &&
        (!!api.listByParent || (!!api.list && !!parentListParamsBuilder)),
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

  const useCreate = createMutationHooks<TItem, TCreate>(
    resource,
    "create",
    api.create,
    {
      retry: false,
      onSuccess: (data, _variables, qc) => {
        invalidateResource(qc);
        onSuccess?.create?.(data);
      },
    },
  );

  // =========================================================================
  // UPDATE MUTATION
  // =========================================================================

  const useUpdate = createMutationHooks<TItem, { id: TId; data: TUpdate }>(
    resource,
    "update",
    ({ id, data }) => api.update(id, data),
    {
      retry: false,
      onSuccess: (data, variables, qc) => {
        const itemId =
          (getItemId(data, idField) as TId | undefined) ?? variables.id;
        qc.invalidateQueries({ queryKey: keys.detail(itemId) });
        invalidateResource(qc);
        onSuccess?.update?.(data);
      },
    },
  );

  const useUpdatePatch = createMutationHooks<TItem, { id: TId; data: TUpdate }>(
    resource,
    "updatePatch",
    ({ id, data }) =>
      api.updatePatch
        ? api.updatePatch(id, data)
        : api.update(id, data as unknown as TUpdate),
    {
      retry: false,
      onSuccess: (data, variables, qc) => {
        const itemId =
          (getItemId(data, idField) as TId | undefined) ?? variables.id;
        qc.invalidateQueries({ queryKey: keys.detail(itemId) });
        invalidateResource(qc);
        onSuccess?.update?.(data);
      },
    },
  );

  // =========================================================================
  // DELETE MUTATION
  // =========================================================================

  const useDelete = createMutationHooks<TDelete, TId>(
    resource,
    "delete",
    api.delete,
    {
      retry: false,
      onSuccess: (data, id, qc) => {
        qc.invalidateQueries({ queryKey: keys.detail(id) });
        invalidateResource(qc);
        onSuccess?.delete?.(data);
      },
    },
  );

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
    useUpdatePatch,
    useDelete,
  };
}
