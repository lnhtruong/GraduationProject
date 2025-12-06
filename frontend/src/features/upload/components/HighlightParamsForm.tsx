import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, X, AlertCircle } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface HighlightParams {
  topic: string;
  includeKeywords: string[];
  excludeKeywords: string[];
}

interface HighlightParamsFormProps {
  onSubmit: (params: HighlightParams) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
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
}: HighlightParamsFormProps) {
  const [topic, setTopic] = React.useState("");
  const [includeKeywords, setIncludeKeywords] = React.useState<string[]>([
    "solution explanations",
    "step-by-step problem solving",
    "algorithm analysis",
    "implementation details",
    "time/space complexity discussion",
  ]);
  const [excludeKeywords, setExcludeKeywords] = React.useState<string[]>([
    "advertisements",
    "course promotions",
    "discount announcements",
    "channel subscriptions",
    "greetings and sign-offs",
    "emotional filler",
  ]);
  const [errors, setErrors] = React.useState<string[]>([]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleIncludeToggle = (keyword: string) => {
    setIncludeKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleExcludeToggle = (keyword: string) => {
    setExcludeKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!topic.trim()) {
      newErrors.push("Vui lòng nhập chủ đề video");
    }

    if (includeKeywords.length === 0) {
      newErrors.push("Vui lòng chọn ít nhất 1 từ khóa cần bao gồm");
    }

    if (excludeKeywords.length === 0) {
      newErrors.push("Vui lòng chọn ít nhất 1 từ khóa cần loại trừ");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      topic: topic.trim(),
      includeKeywords,
      excludeKeywords,
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Error Alert */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Topic Input */}
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-base font-medium">
            Chủ đề video <span className="text-destructive">*</span>
          </Label>
          <Input
            id="topic"
            placeholder="VD: Binary Tree data structures and problem-solving"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isSubmitting}
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">
            Mô tả ngắn gọn về nội dung chính của video
          </p>
        </div>

        {/* Include Keywords */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Từ khóa cần bao gồm <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Chọn các loại nội dung bạn muốn giữ lại trong clips
          </p>
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
        </div>

        {/* Exclude Keywords */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Từ khóa cần loại trừ <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Chọn các loại nội dung bạn muốn bỏ qua trong clips
          </p>
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
                <Badge key={keyword} variant="secondary" className="gap-1">
                  {keyword}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleExcludeToggle(keyword)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
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
    </Card>
  );
}