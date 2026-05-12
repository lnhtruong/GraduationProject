import { useMutation } from "@tanstack/react-query";
import { reportApi, type CreateReportDto } from "./report.api";

export function useSubmitReport() {
  return useMutation({
    mutationFn: (dto: CreateReportDto) => reportApi.submit(dto),
  });
}
