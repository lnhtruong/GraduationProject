"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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

interface LecturerRequestFormProps {
  open: boolean;
  onClose: () => void;
}

export function LecturerRequestForm({ open, onClose }: LecturerRequestFormProps) {
  const createMutation = useCreateLecturerRequest();

  const form = useForm<LecturerRequestFormData>({
    resolver: zodResolver(lecturerRequestSchema),
    defaultValues: { confirm: "" },
  });

  const confirmValue = form.watch("confirm") ?? "";

  const handleSubmit = async (values: LecturerRequestFormData) => {
    try {
      await createMutation.mutateAsync({ confirm: values.confirm || undefined });
      toast.success("Yêu cầu đã được gửi! Chúng tôi sẽ xem xét sớm nhất.");
      form.reset();
      onClose();
    } catch {
      toast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !createMutation.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
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
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <p className="ml-auto text-right text-xs text-muted-foreground">
                      {confirmValue.length}/5000
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createMutation.isPending}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
