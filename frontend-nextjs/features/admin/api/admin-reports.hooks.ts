import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminReportsApi } from "./admin-reports.api";
import { USE_MOCK, MOCK_REPORTS } from "../mock/admin-reports.mock";
import { ADMIN_DASHBOARD_KEY } from "./admin-dashboard.hooks";
import type { ReportListParams, ReviewReportDto } from "../types/report.types";

const ADMIN_REPORT_KEYS = {
  all: ["admin", "reports"] as const,
  list: (params?: ReportListParams) =>
    ["admin", "reports", "list", params] as const,
  detail: (id: number) => ["admin", "reports", id] as const,
};

export function useAdminReports(params?: ReportListParams) {
  return useQuery({
    queryKey: ADMIN_REPORT_KEYS.list(params),
    queryFn: USE_MOCK
      ? () =>
          Promise.resolve({
            items: MOCK_REPORTS,
            pagination: { page: 1, limit: 20, totalItems: MOCK_REPORTS.length, totalPages: 1 },
          })
      : () => adminReportsApi.listAll(params),
    staleTime: 30_000,
  });
}

export function useAdminReportDetail(id: number | null) {
  return useQuery({
    queryKey: ADMIN_REPORT_KEYS.detail(id ?? 0),
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_REPORTS.find((r) => r.id === id) ?? null)
      : () => adminReportsApi.getById(id!),
    enabled: id !== null,
    staleTime: 30_000,
  });
}

export function useReviewReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ReviewReportDto }) =>
      adminReportsApi.reviewReport(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_REPORT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_KEY });
    },
  });
}
