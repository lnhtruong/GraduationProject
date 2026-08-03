"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { lecturerRequestSchema, type LecturerRequestFormData } from "../../schemas";
import { useCreateLecturerRequest } from "../../api/lecturer-requests.hooks";
import { EvidenceImagePicker } from "@/features/image/components/EvidenceImagePicker";

interface LecturerRequestFormProps {
  open: boolean;
  onClose: () => void;
}

export function LecturerRequestForm({ open, onClose }: LecturerRequestFormProps) {
  const createMutation = useCreateLecturerRequest();

  const form = useForm<LecturerRequestFormData>({
    resolver: zodResolver(lecturerRequestSchema),
    defaultValues: { teachingTopics: "", confirm: "", evidenceImageIds: [] },
  });

  const confirmValue = useWatch({ control: form.control, name: "confirm" }) ?? "";

  const handleClose = () => {
    if (createMutation.isPending) return;
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: LecturerRequestFormData) => {
    const confirm = values.confirm?.trim();
    try {
      await createMutation.mutateAsync({
        confirm: confirm || undefined,
        teachingTopics: values.teachingTopics.trim(),
        evidenceImageIds: values.evidenceImageIds,
      });
      toast.success("Yêu cầu đã được gửi! Chúng tôi sẽ xem xét sớm nhất.");
      form.reset();
      onClose();
    } catch {
      toast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) handleClose(); }}>
      <DialogContent className="flex max-h-[min(760px,calc(100dvh-1rem))] w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 sm:max-w-2xl">
        <div className="shrink-0 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span>Đăng ký trở thành Giảng viên</span>
            </DialogTitle>
            <DialogDescription className="max-w-2xl leading-relaxed">
              Điền thông tin chuyên môn và giấy tờ xác thực để admin xét duyệt hồ sơ của bạn.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto border-y bg-muted/[0.08] px-5 py-5 sm:px-7">
              <div className="space-y-5">
                <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>Sau khi được duyệt, bạn sẽ có quyền tạo và quản lý khoá học. Thời gian xét duyệt thường trong 1-3 ngày làm việc.</p>
                </div>

                <section className="rounded-xl border bg-background p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">Hồ sơ giảng dạy</p>
                      <p className="mt-1 text-xs text-muted-foreground">Thông tin giúp admin phân loại và xét duyệt hồ sơ nhanh hơn.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="teachingTopics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lĩnh vực muốn giảng dạy <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ví dụ: Python cơ bản, Thiết kế UI/UX, Marketing số..."
                              maxLength={255}
                              disabled={createMutation.isPending}
                              className="h-12 rounded-xl bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kinh nghiệm / giới thiệu bản thân <span className="font-normal text-muted-foreground">(tuỳ chọn)</span></FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Chia sẻ kinh nghiệm giảng dạy, chuyên môn, chứng chỉ nổi bật hoặc portfolio của bạn..."
                              className="min-h-36 resize-none rounded-xl bg-background"
                              maxLength={5000}
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between gap-3">
                            <FormMessage />
                            <p className="ml-auto text-right text-xs text-muted-foreground">
                              {confirmValue.length}/5000
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className="rounded-xl border bg-background p-4 shadow-sm sm:p-5">
                  <div className="mb-4 space-y-1">
                    <p className="text-base font-semibold text-foreground">Giấy tờ xác thực</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Ảnh chỉ dùng để xét duyệt vai trò giảng viên và không hiển thị công khai.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="evidenceImageIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <EvidenceImagePicker
                            type="role_upgrade"
                            value={field.value}
                            onChange={field.onChange}
                            disabled={createMutation.isPending}
                            label="Chứng chỉ, bằng cấp hoặc giấy tờ định danh"
                            helperText="Tải ảnh rõ nội dung, không bị cắt mép. Tối đa 5 ảnh."
                            uploadButtonLabel="Thêm ảnh giấy tờ"
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-3 bg-background px-5 py-4 sm:justify-end sm:px-7">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="w-full rounded-xl font-semibold sm:w-auto"
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="w-full rounded-xl gap-2 font-semibold sm:w-auto">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {createMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
