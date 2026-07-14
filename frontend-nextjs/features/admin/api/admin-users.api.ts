import { apiHttpClient } from "@/features/_shared/api-factories";

export interface AdminUser {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: number;
  isBanned: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: number;
  avatarUrl?: string;
  isBanned?: boolean;
}

export type UserSortBy = "createdAt" | "email" | "firstName" | "lastName" | "id";
export type SortOrder = "asc" | "desc";

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: number;
  isBanned?: boolean;
  sortBy?: UserSortBy;
  sortOrder?: SortOrder;
}

export interface AdminUsersResponse {
  data: AdminUser[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}

export interface AdminUserStats {
  total: number;
  admins: number;
  students: number;
  lecturers: number;
}

export const adminUsersApi = {
  listAll: async (params?: AdminUsersParams): Promise<AdminUsersResponse> => {
    const query: Record<string, string | number | boolean> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 15,
    };
    if (params?.search?.trim()) query.search = params.search.trim();
    if (params?.role !== undefined) query.role = params.role;
    if (params?.isBanned !== undefined) query.isBanned = params.isBanned;
    if (params?.sortBy) query.sortBy = params.sortBy;
    if (params?.sortOrder) query.sortOrder = params.sortOrder;

    const { data } = await apiHttpClient.get<AdminUsersResponse | AdminUser[]>("/users", { params: query });
    // Normalize: BE có thể trả array hoặc { data, pagination }
    if (Array.isArray(data)) {
      return { data, pagination: { page: 1, limit: data.length, totalItems: data.length, totalPages: 1 } };
    }
    return data as AdminUsersResponse;
  },

  getStats: async (): Promise<AdminUserStats> => {
    const { data } = await apiHttpClient.get<AdminUserStats>("/users/stats");
    return data;
  },

  getById: async (id: number): Promise<AdminUser> => {
    const { data } = await apiHttpClient.get<AdminUser>(`/users/${id}`);
    return data;
  },

  update: async (id: number, dto: UpdateUserDto): Promise<AdminUser> => {
    const { data } = await apiHttpClient.patch<AdminUser>(`/users/${id}`, dto);
    return data;
  },

  resetPassword: async (id: number): Promise<void> => {
    await apiHttpClient.patch(`/users/reset/${id}`);
  },
};
