"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { lecturerRequestSchema, type LecturerRequestFormData } from "../../schemas";
import { useCreateLecturerRequest } from "../../api/lecturer-requests.hooks";
import { EvidenceImagePicker } from "@/features/image/components/EvidenceImagePicker";

interface LecturerRequestFormProps {
  open: boolean;
  onClose: () => void;
}

export function LecturerRequestForm({ open, onClose }: LecturerRequestFormProps) {
  const createMutation = useCreateLecturerRequest();
  const [evidenceImageIds, setEvidenceImageIds] = useState<number[]>([]);

  const form = useForm<LecturerRequestFormData>({
    resolver: zodResolver(lecturerRequestSchema),
    defaultValues: { confirm: "" },
  });

  const confirmValue = useWatch({ control: form.control, name: "confirm" }) ?? "";

  const handleClose = () => {
    if (createMutation.isPending) return;
    form.reset();
    setEvidenceImageIds([]);
    onClose();
  };

  const handleSubmit = async (values: LecturerRequestFormData) => {
    if (evidenceImageIds.length === 0) {
      toast.error("Vui lòng tải lên ít nhất một ảnh chứng minh năng lực.");
      return;
    }

    const confirm = values.confirm?.trim();
    try {
      await createMutation.mutateAsync({
        confirm: confirm || undefined,
        evidenceImageIds,
      });
      toast.success("Yêu cầu đã được gửi! Chúng tôi sẽ xem xét sớm nhất.");
      form.reset();
      setEvidenceImageIds([]);
      onClose();
    } catch {
      toast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đăng ký trở thành Giảng viên</DialogTitle>
        </DialogHeader>

        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
            Sau khi được duyệt, bạn sẽ có quyền tạo và quản lý khoá học trên
            nền tảng. Yêu cầu sẽ được xem xét trong vòng 1–3 ngày làm việc.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do / Giới thiệu bản thân (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Chia sẻ kinh nghiệm, lĩnh vực chuyên môn và lý do bạn muốn trở thành giảng viên..."
                      className="min-h-32 resize-none"
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

            <EvidenceImagePicker
              type="role_upgrade"
              value={evidenceImageIds}
              onChange={setEvidenceImageIds}
              disabled={createMutation.isPending}
              required
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="w-full sm:w-auto"
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                {createMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
