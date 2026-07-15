import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

import {
  highlightParamsSchema,
  type HighlightParamsFormValues,
} from "../schemas";
import type { HighlightParams } from "../types";

interface HighlightParamsFormProps {
  onSubmit: (params: HighlightParams) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  noCard?: boolean;
}

const INCLUDE_PRESETS = [
  "Ví dụ thực tế",
  "Giải thích cốt lõi",
  "Hướng dẫn từng bước",
  "Mẹo quan trọng",
  "Đoạn dễ hiểu",
];

const EXCLUDE_PRESETS = [
  "Chào đầu video",
  "Quảng cáo",
  "Đoạn im lặng",
  "Nội dung lặp lại",
  "Phần ngoài chủ đề",
];

function parsePreferences(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinPreferences(values: string[]) {
  return values.join(", ");
}

export default function HighlightParamsForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  noCard = false,
}: HighlightParamsFormProps) {
  const [includeInput, setIncludeInput] = React.useState("");
  const [excludeInput, setExcludeInput] = React.useState("");
  const form = useForm<HighlightParamsFormValues>({
    resolver: zodResolver(highlightParamsSchema),
    defaultValues: {
      topic: "",
      includeKeywords: [],
      excludeKeywords: [],
      isMultiOutput: false,
    },
  });

  const handleFormSubmit = form.handleSubmit((data) => {
    onSubmit({
      topic: data.topic.trim(),
      includeKeywords: data.includeKeywords,
      excludeKeywords: data.excludeKeywords,
      isMultiOutput: data.isMultiOutput,
    });
  });

  const applyPreset = React.useCallback(
    (
      fieldName: "includeKeywords" | "excludeKeywords",
      value: string,
      setInput: React.Dispatch<React.SetStateAction<string>>,
    ) => {
      const nextValues = Array.from(
        new Set([...form.getValues(fieldName), value]),
      );
      form.setValue(fieldName, nextValues, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setInput(joinPreferences(nextValues));
    },
    [form],
  );

  const content = (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold">
            Bạn muốn lấy phần nào trong video?
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Mô tả mục tiêu học để StudyLoop ưu tiên đúng đoạn cần giữ.
          </p>
        </div>

        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Video này nói về gì? <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ví dụ: React hooks, kỹ năng thuyết trình, thuật toán cây nhị phân..."
                  {...field}
                  disabled={isSubmitting}
                  className="h-12 text-base"
                />
              </FormControl>
              <FormDescription>
                Càng rõ chủ đề thì đoạn highlight càng dễ đúng ý.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isMultiOutput"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Kiểu kết quả
              </FormLabel>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => field.onChange(false)}
                    className={cn(
                      "rounded-lg border bg-background p-4 text-left transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70",
                      !field.value && "border-primary shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="font-semibold">Một đoạn hay nhất</div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Dùng khi muốn mở Studio nhanh và chỉnh tiếp ngay.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => field.onChange(true)}
                    className={cn(
                      "rounded-lg border bg-background p-4 text-left transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70",
                      field.value && "border-primary shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="font-semibold">Nhiều đoạn để chọn</div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Dùng khi video dài và cần so sánh vài phương án.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="includeKeywords"
            render={({ field }) => (
              <FormItem className="flex h-full flex-col">
                <FormLabel className="text-base font-medium">
                  Muốn giữ lại nội dung gì?
                </FormLabel>
                <FormControl>
                  <Input
                    value={includeInput}
                    onChange={(event) => {
                      setIncludeInput(event.target.value);
                      field.onChange(parsePreferences(event.target.value));
                    }}
                    placeholder="Ví dụ: ví dụ thực tế, đoạn minh họa, công thức quan trọng"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <div className="flex min-h-[5.75rem] content-start flex-wrap gap-2 pt-1">
                  {INCLUDE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        applyPreset("includeKeywords", preset, setIncludeInput)
                      }
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <FormDescription className="mt-auto">
                  Có thể nhập nhiều ý, cách nhau bằng dấu phẩy.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="excludeKeywords"
            render={({ field }) => (
              <FormItem className="flex h-full flex-col">
                <FormLabel className="text-base font-medium">
                  Muốn bỏ qua phần nào?
                </FormLabel>
                <FormControl>
                  <Input
                    value={excludeInput}
                    onChange={(event) => {
                      setExcludeInput(event.target.value);
                      field.onChange(parsePreferences(event.target.value));
                    }}
                    placeholder="Ví dụ: chào đầu, quảng cáo, đoạn nghỉ"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <div className="flex min-h-[5.75rem] content-start flex-wrap gap-2 pt-1">
                  {EXCLUDE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        applyPreset("excludeKeywords", preset, setExcludeInput)
                      }
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <FormDescription className="mt-auto">
                  Để trống nếu muốn StudyLoop tự chọn tự nhiên.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 flex-1"
          >
            Quay lại
          </Button>
          <Button type="submit" disabled={isSubmitting} className="h-11 flex-1">
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang xử lý
              </>
            ) : (
              <>
                Tạo highlight
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (noCard) return <div className="p-1">{content}</div>;

  return <Card className="p-5 sm:p-6">{content}</Card>;
}

