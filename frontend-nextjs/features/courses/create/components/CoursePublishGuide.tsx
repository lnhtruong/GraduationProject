import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Sparkles, Target, WandSparkles } from "lucide-react";

const QUALITY_CHECKLIST = [
  "Tên khóa học nêu rõ kết quả đầu ra.",
  "Danh mục phản ánh đúng nhóm nội dung.",
  "Thời lượng hợp lý với mức độ bài học.",
  "Ngôn ngữ và mức giá đúng đối tượng.",
];

export default function CoursePublishGuide() {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
        <CardHeader className="space-y-3">
          <Badge className="w-fit gap-1 bg-primary/15 text-primary hover:bg-primary/15">
            <WandSparkles className="h-3.5 w-3.5" />
            Publish Assistant
          </Badge>
          <CardTitle className="text-lg">Checklist trước khi tạo</CardTitle>
          <CardDescription>
            Hoàn thiện thông tin lõi để tăng tỷ lệ duyệt và giữ trải nghiệm học
            viên nhất quán.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pb-6">
          {QUALITY_CHECKLIST.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-foreground/90">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Gợi ý tối ưu
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Với khóa học trả phí, nên viết mô tả ngắn tập trung vào giá trị học
            viên đạt được sau khi hoàn thành.
          </p>
          <Separator />
          <p>
            Nếu bạn đang thử nghiệm nội dung mới, hãy để trạng thái nháp để dễ
            cập nhật trước khi gửi duyệt.
          </p>
          <Separator />
          <p className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Sau khi tạo thành công, bạn sẽ được chuyển thẳng đến trang chi tiết
            để tiếp tục hoàn thiện bài học.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
