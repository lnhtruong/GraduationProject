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
  // isBanned: chờ backend thêm field vào UpdateUserDto và fix @IsOptional() trên password
}

export const adminUsersApi = {
  listAll: async (): Promise<AdminUser[]> => {
    const { data } = await apiHttpClient.get<AdminUser[]>("/users");
    return Array.isArray(data) ? data : [];
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
