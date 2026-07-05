import { apiHttpClient } from "@/features/_shared/api-factories";
import type { User } from "@/store/auth";

export const profileApi = {
  getMe: async (): Promise<User> => {
    const response = await apiHttpClient.get<User>("/users/me");
    return response.data;
  },

  updateProfile: async (userId: number, data: { firstName: string; lastName: string }) => {
    const response = await apiHttpClient.patch<User>(`/users/${userId}`, data);
    return response.data;
  },
};
