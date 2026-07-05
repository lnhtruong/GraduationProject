import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
  LecturerRequest,
  CreateLecturerRequestDto,
  ReviewLecturerRequestDto,
  LecturerRequestListParams,
  LecturerRequestListResponse,
} from "../types/lecturer-request.types";

export const studentLecturerRequestApi = {
  create: async (dto: CreateLecturerRequestDto): Promise<LecturerRequest> => {
    const { data } = await apiHttpClient.post<LecturerRequest>(
      "/users/lecturer-requests",
      dto,
    );
    return data;
  },

  listMine: async (
    params?: LecturerRequestListParams,
  ): Promise<LecturerRequestListResponse> => {
    const { data } = await apiHttpClient.get<LecturerRequestListResponse>(
      "/users/lecturer-requests/mine",
      { params },
    );
    return data;
  },

  getById: async (id: number): Promise<LecturerRequest> => {
    const { data } = await apiHttpClient.get<LecturerRequest>(
      `/users/lecturer-requests/${id}`,
    );
    return data;
  },
};

export const adminLecturerRequestApi = {
  listAll: async (
    params?: LecturerRequestListParams,
  ): Promise<LecturerRequestListResponse> => {
    const { data } = await apiHttpClient.get<LecturerRequestListResponse>(
      "/users/lecturer-requests",
      { params },
    );
    return data;
  },

  getById: async (id: number): Promise<LecturerRequest> => {
    const { data } = await apiHttpClient.get<LecturerRequest>(
      `/users/lecturer-requests/${id}`,
    );
    return data;
  },

  review: async (
    id: number,
    dto: ReviewLecturerRequestDto,
  ): Promise<LecturerRequest> => {
    const { data } = await apiHttpClient.patch<LecturerRequest>(
      `/users/lecturer-requests/${id}/review`,
      dto,
    );
    return data;
  },
};
