"use client";

import { useWatch, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Flag, Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSubmitReport } from "../api/report.hooks";
import type { ReportCategory, ReportTargetType } from "../types";
import { EvidenceImagePicker } from "@/features/image/components/EvidenceImagePicker";

interface Props {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
  targetLabel: string;
}

const MAX_REASON = 2000;
const MIN_REASON = 5;
const MAX_EVIDENCE_IMAGES = 5;

const reportCategoryValues = [
  "misleading",
  "copyright",
  "inappropriate",
  "spam",
  "harassment",
  "other",
] as const satisfies readonly ReportCategory[];

const reportSchema = z.object({
  reportCategory: z.enum(reportCategoryValues, {
    message: "Vui lòng chọn loại vi phạm.",
  }),
  reason: z
    .string()
    .trim()
    .min(MIN_REASON, `Lý do báo cáo cần ít nhất ${MIN_REASON} ký tự.`)
    .max(MAX_REASON, `Lý do báo cáo không được vượt quá ${MAX_REASON} ký tự.`),
  evidenceImageIds: z.array(z.number()).max(MAX_EVIDENCE_IMAGES, `Tối đa ${MAX_EVIDENCE_IMAGES} ảnh minh chứng.`),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const REPORT_CATEGORY_OPTIONS: Array<{ value: ReportCategory; label: string }> = [
  { value: "misleading", label: "Thông tin sai lệch" },
  { value: "copyright", label: "Vi phạm bản quyền" },
  { value: "inappropriate", label: "Nội dung không phù hợp" },
  { value: "spam", label: "Spam hoặc lừa đảo" },
  { value: "harassment", label: "Quấy rối hoặc xúc phạm" },
  { value: "other", label: "Vấn đề khác" },
];

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message: string | undefined = error.response?.data?.message;
    if (status === 409) return message ?? "Báo cáo đã tồn tại hoặc nội dung không còn hợp lệ.";
    if (status === 403) return message ?? "Bạn không thể báo cáo nội dung này.";
    if (status === 404) return "Không tìm thấy nội dung cần báo cáo.";
    if (status === 400) return message ?? "Dữ liệu báo cáo không hợp lệ.";
  }
  return "Gửi báo cáo thất bại. Vui lòng thử lại.";
}

export function ReportDialog({ open, onClose, targetType, targetId, targetLabel }: Props) {
  const submit = useSubmitReport();
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    mode: "onChange",
    defaultValues: {
      reportCategory: undefined,
      reason: "",
      evidenceImageIds: [],
    },
  });

  const reasonValue = useWatch({ control: form.control, name: "reason" }) ?? "";
  const charCount = reasonValue.length;

  const handleClose = () => {
    if (submit.isPending) return;
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: ReportFormValues) => {
    try {
      await submit.mutateAsync({
        targetType,
        targetId,
        reportCategory: values.reportCategory,
        reason: values.reason.trim(),
        ...(values.evidenceImageIds.length > 0 ? { evidenceImageIds: values.evidenceImageIds } : {}),
      });
      toast.success("Đã gửi báo cáo. Chúng tôi sẽ xem xét sớm nhất có thể.");
      form.reset();
      onClose();
    } catch (err) {
      form.setError("root", { message: getErrorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) handleClose(); }}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 border-b bg-muted/30 px-4 py-4 sm:px-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Flag className="h-5 w-5" />
              </span>
              <span>Báo cáo {targetLabel}</span>
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Chọn loại vi phạm và mô tả ngắn gọn để đội ngũ kiểm duyệt xử lý đúng ngữ cảnh.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Nội dung báo cáo
                </div>

                <FormField
                  control={form.control}
                  name="reportCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại vi phạm <span className="text-destructive">*</span></FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.clearErrors("root");
                        }}
                        disabled={submit.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Chọn loại vi phạm" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REPORT_CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-primary" />Lý do báo cáo <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={`Nhập lý do báo cáo (ít nhất ${MIN_REASON} ký tự)...`}
                          className="h-32 resize-none text-sm"
                          maxLength={MAX_REASON}
                          disabled={submit.isPending}
                          onChange={(event) => {
                            field.onChange(event.target.value.slice(0, MAX_REASON));
                            form.clearErrors("root");
                          }}
                        />
                      </FormControl>
                      <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
                        <div className="min-w-0 space-y-1">
                          <FormMessage />
                          {!form.formState.errors.reason && (
                            <p>Mô tả cụ thể giúp admin kiểm tra nhanh hơn.</p>
                          )}
                        </div>
                        <span className={`shrink-0 ${charCount > MAX_REASON * 0.9 ? "text-amber-500" : ""}`}>
                          {charCount}/{MAX_REASON}
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </section>

              <FormField
                control={form.control}
                name="evidenceImageIds"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EvidenceImagePicker
                        type="report"
                        value={field.value}
                        onChange={(nextValue) => {
                          field.onChange(nextValue);
                          form.clearErrors("root");
                        }}
                        disabled={submit.isPending}
                        label="Tệp ảnh đính kèm"
                        variant="inline"
                        helperText="Không bắt buộc. Tải ảnh liên quan trực tiếp đến báo cáo, tối đa 5 ảnh."
                        uploadButtonLabel="Thêm ảnh minh chứng"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root?.message && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
            </div>

            <DialogFooter className="shrink-0 gap-3 border-t bg-background/95 px-4 py-3 sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submit.isPending}
                className="w-full border-muted-foreground/30 bg-background font-semibold text-foreground hover:bg-muted sm:w-auto"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || submit.isPending}
                className="w-full gap-2 font-semibold sm:w-auto"
              >
                {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Gửi báo cáo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
