import { useMutation } from "@tanstack/react-query";
import { reportApi } from "./report.api";
import type { CreateReportDto } from "../types";

export function useSubmitReport() {
  return useMutation({
    mutationFn: (dto: CreateReportDto) => reportApi.submit(dto),
  });
}
