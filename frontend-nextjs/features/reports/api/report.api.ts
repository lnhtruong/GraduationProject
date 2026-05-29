import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { CreateReportDto, Report } from "../types";

export const reportApi = createApi({
  submit: async (dto: CreateReportDto): Promise<Report> => {
    const { data } = await apiHttpClient.post<Report>("/course/reports", dto);
    return data;
  },
});
