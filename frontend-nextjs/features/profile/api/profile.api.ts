import { apiHttpClient } from "@/features/_shared/api-factories";

export const profileApi = {
  updateProfile: async (userId: number, data: { firstName: string; lastName: string }) => {
    const response = await apiHttpClient.patch(`/users/${userId}`, data);
    return response.data;
  },
};
