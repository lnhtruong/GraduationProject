import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
  Report,
  ReportListParams,
  ReportListResponse,
  ReviewReportDto,
} from "../types/report.types";

export const adminReportsApi = {
  listAll: async (params?: ReportListParams): Promise<ReportListResponse> => {
    const { data } = await apiHttpClient.get<ReportListResponse>(
      "/course/reports",
      { params },
    );
    return data;
  },

  getById: async (id: number): Promise<Report> => {
    const { data } = await apiHttpClient.get<Report>(`/course/reports/${id}`);
    return data;
  },

  reviewReport: async (id: number, dto: ReviewReportDto): Promise<Report> => {
    const { data } = await apiHttpClient.patch<Report>(
      `/course/reports/${id}/review`,
      dto,
    );
    return data;
  },
};
