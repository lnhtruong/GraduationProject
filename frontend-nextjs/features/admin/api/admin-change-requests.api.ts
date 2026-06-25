import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
  ChangeRequestListParams,
  ChangeRequestListResponse,
  ReviewChangeRequestDto,
  ReviewChangeRequestResponse,
} from "../types/change-request.types";

export const adminChangeRequestsApi = {
  listAll: async (params?: ChangeRequestListParams): Promise<ChangeRequestListResponse> => {
    const { data } = await apiHttpClient.get<ChangeRequestListResponse>(
      "/course/courses/change-requests",
      { params },
    );
    return data;
  },

  review: async (
    requestId: number,
    dto: ReviewChangeRequestDto,
  ): Promise<ReviewChangeRequestResponse> => {
    const { data } = await apiHttpClient.patch<ReviewChangeRequestResponse>(
      `/course/courses/change-requests/${requestId}/review`,
      dto,
    );
    return data;
  },
};
