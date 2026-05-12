import { apiHttpClient } from "@/features/_shared/api-factories";
import type { ReportTargetType } from "@/features/admin/types/report.types";

export interface CreateReportDto {
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
}

export const reportApi = {
  submit: (dto: CreateReportDto) =>
    apiHttpClient.post("/course/reports", dto),
};
