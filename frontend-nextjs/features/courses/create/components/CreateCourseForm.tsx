"use client";

import { Plus, Tag, Loader2, Clock3, Coins, BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCreateCourseForm } from "../hooks/useCreateCourseForm";
import CourseDescriptionEditor from "./CourseDescriptionEditor";
import {
  COURSE_LANGUAGE_OPTIONS,
  COURSE_LEVEL_OPTIONS,
  COURSE_STATUS_OPTIONS,
} from "../types";

export default function CreateCourseForm() {
  const {
    form,
    categoryDraft,
    setCategoryDraft,
    addCategory,
    removeCategory,
    onSubmit,
    isSubmitting,
  } = useCreateCourseForm();

  const previewName = form.watch("name");
  const previewLevel = form.watch("level");
  const previewPrice = form.watch("price");
  const previewHours = form.watch("durationHours");
  const previewMinutes = form.watch("durationMinutes");
  const previewCategories = form.watch("categories");
  const previewDescription = form.watch("description");

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle>Thông tin cơ bản khóa học</CardTitle>
          <CardDescription>
            Cấu hình các thông tin cần thiết để khởi tạo khóa học mới.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên khóa học</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="VD: AI cho người mới bắt đầu"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Đặt tên rõ ràng, phản ánh giá trị chính học viên nhận được.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả khóa học</FormLabel>
                    <FormControl>
                      <CourseDescriptionEditor
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Bạn có thể custom tiêu đề, bullet list, quote, link và căn
                      lề để tạo mô tả theo phong cách riêng.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <FormLabel>Danh mục</FormLabel>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={categoryDraft}
                        onChange={(event) =>
                          setCategoryDraft(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addCategory();
                          }
                        }}
                        placeholder="Thêm danh mục, ví dụ: AI, Data Science"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCategory}
                        disabled={isSubmitting || !categoryDraft.trim()}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm
                      </Button>
                    </div>

                    {previewCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {previewCategories.map((category) => (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeCategory(category)}
                          >
                            <Tag className="mr-1 h-3 w-3" />
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <FormDescription>
                      Nhấn vào tag để xóa nhanh danh mục đã thêm.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cấp độ</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn cấp độ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_LEVEL_OPTIONS.map((option) => (
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngôn ngữ</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn ngôn ngữ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_LANGUAGE_OPTIONS.map((language) => (
                            <SelectItem key={language} value={language}>
                              {language}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="durationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số giờ</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={23}
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value || 0))
                          }
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số phút</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value || 0))
                          }
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá khóa học (VND)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value || 0))
                          }
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Nhập 0 nếu đây là khóa học miễn phí.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isSubmitting}
                >
                  Đặt lại
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo khóa học"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Xem nhanh thông tin tạo</CardTitle>
          <CardDescription>
            Bản xem trước giúp bạn kiểm tra tổng quan trước khi submit.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <BookMarked className="h-4 w-4 text-primary" />
            <span className="font-medium">{previewName || "Chưa có tên khóa học"}</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                <BookMarked className="h-3.5 w-3.5" />
                Cấp độ
              </div>
              <p className="font-medium">{previewLevel}</p>
            </div>

            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Thời lượng
              </div>
              <p className="font-medium">
                {previewHours}h {previewMinutes}m
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                <Coins className="h-3.5 w-3.5" />
                Học phí
              </div>
              <p className="font-medium">{previewPrice.toLocaleString("vi-VN")}đ</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {previewCategories.map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
          </div>

          {previewDescription?.trim() ? (
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-6">
              <div
                className="grid gap-x-10 gap-y-2 text-foreground/90 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline [&_img]:my-3 [&_img]:w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border/60"                dangerouslySetInnerHTML={{ __html: previewDescription }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
