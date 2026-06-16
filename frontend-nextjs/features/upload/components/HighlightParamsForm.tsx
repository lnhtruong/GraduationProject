import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Sparkles, X } from "lucide-react";
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

// ============================================================================
// CONSTANTS - Danh sách keywords có sẵn
// ============================================================================

const AVAILABLE_INCLUDE_KEYWORDS = [
  "solution explanations",
  "step-by-step problem solving",
  "algorithm analysis",
  "implementation details",
  "time/space complexity discussion",
  "code walkthrough",
  "debugging tips",
  "optimization techniques",
  "best practices",
  "common mistakes",
];

const AVAILABLE_EXCLUDE_KEYWORDS = [
  "advertisements",
  "course promotions",
  "discount announcements",
  "channel subscriptions",
  "greetings and sign-offs",
  "emotional filler",
  "personal stories",
  "off-topic discussions",
  "Q&A sessions",
  "thank you messages",
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function HighlightParamsForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  noCard = false,
}: HighlightParamsFormProps) {
  const form = useForm<HighlightParamsFormValues>({
    resolver: zodResolver(highlightParamsSchema),
    defaultValues: {
      topic: "",
      includeKeywords: [
        "solution explanations",
        "step-by-step problem solving",
        "algorithm analysis",
        "implementation details",
        "time/space complexity discussion",
      ],
      excludeKeywords: [
        "advertisements",
        "course promotions",
        "discount announcements",
        "channel subscriptions",
        "greetings and sign-offs",
        "emotional filler",
      ],
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleIncludeToggle = (keyword: string) => {
    const current = form.getValues("includeKeywords");
    form.setValue(
      "includeKeywords",
      current.includes(keyword)
        ? current.filter((k) => k !== keyword)
        : [...current, keyword],
      { shouldValidate: true },
    );
  };

  const handleExcludeToggle = (keyword: string) => {
    const current = form.getValues("excludeKeywords");
    form.setValue(
      "excludeKeywords",
      current.includes(keyword)
        ? current.filter((k) => k !== keyword)
        : [...current, keyword],
      { shouldValidate: true },
    );
  };

  const handleFormSubmit = form.handleSubmit((data) => {
    onSubmit({
      topic: data.topic.trim(),
      includeKeywords: data.includeKeywords,
      excludeKeywords: data.excludeKeywords,
    });
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  const includeKeywords = useWatch({
    control: form.control,
    name: "includeKeywords",
  });
  const excludeKeywords = useWatch({
    control: form.control,
    name: "excludeKeywords",
  });

  const content = (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Cấu hình Highlight Reel</h3>
            <p className="text-sm text-muted-foreground">
              Cung cấp thông tin để tạo clips chất lượng cao
            </p>
          </div>
        </div>

        {/* Topic Input */}
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Chủ đề video <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: Binary Tree data structures and problem-solving"
                  {...field}
                  disabled={isSubmitting}
                  className="text-base"
                />
              </FormControl>
              <FormDescription>
                Mô tả ngắn gọn về nội dung chính của video
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Include Keywords */}
        <FormField
          control={form.control}
          name="includeKeywords"
          render={() => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Từ khóa cần bao gồm{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormDescription>
                Chọn các loại nội dung bạn muốn giữ lại trong clips
              </FormDescription>
              <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-muted/20 rounded-lg">
                {AVAILABLE_INCLUDE_KEYWORDS.map((keyword) => (
                  <div key={keyword} className="flex items-center space-x-2">
                    <Checkbox
                      id={`include-${keyword}`}
                      checked={includeKeywords.includes(keyword)}
                      onCheckedChange={() => handleIncludeToggle(keyword)}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`include-${keyword}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {keyword}
                    </Label>
                  </div>
                ))}
              </div>
              {/* Selected badges */}
              {includeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {includeKeywords.map((keyword) => (
                    <Badge key={keyword} variant="default" className="gap-1">
                      {keyword}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleIncludeToggle(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Exclude Keywords */}
        <FormField
          control={form.control}
          name="excludeKeywords"
          render={() => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Từ khóa cần loại trừ
              </FormLabel>
              <FormDescription>
                Chọn các loại nội dung bạn muốn bỏ qua trong clips
              </FormDescription>
              <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-muted/20 rounded-lg">
                {AVAILABLE_EXCLUDE_KEYWORDS.map((keyword) => (
                  <div key={keyword} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exclude-${keyword}`}
                      checked={excludeKeywords.includes(keyword)}
                      onCheckedChange={() => handleExcludeToggle(keyword)}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`exclude-${keyword}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {keyword}
                    </Label>
                  </div>
                ))}
              </div>
              {/* Selected badges */}
              {excludeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {excludeKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="gap-1"
                    >
                      {keyword}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleExcludeToggle(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Tạo Highlight Clips
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (noCard) {
    return <div className="p-1">{content}</div>;
  }

  return (
    <Card className="p-6">
      {content}
    </Card>
  );
}
