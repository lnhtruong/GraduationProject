"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ManagementPageShell } from "@/features/instructor/course-management/components/ManagementPageShell";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCreateRoadmap } from "./api/roadmap-management.hooks";
import { Input } from "@/components/ui/input";

export default function RoadmapCreate() {
  const router = useRouter();
  const { user } = useAuth();
  const createRoadmapMutation = useCreateRoadmap();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên lộ trình");
      return;
    }

    const created = await createRoadmapMutation.mutateAsync({
      userId: user?.id,
      name: name.trim(),
      description: description.trim() || undefined,
    });

    toast.success("Đã tạo lộ trình");

    router.push(`/instructor/roadmaps/${created.id}`);
    router.refresh();
  };

  const handleSubmitCreateRoadmap = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    await handleCreate();
  };

  return (
    <ManagementPageShell
      title="Tạo lộ trình mới"
      description="Thiết lập thông tin cơ bản cho lộ trình học tập của bạn."
      breadcrumbs={[
        { label: "Quản lý lộ trình", href: "/instructor/roadmaps" },
        { label: "Tạo mới" },
      ]}
      action={
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/instructor/roadmaps">Hủy</Link>
          </Button>
          <Button
            type="submit"
            form="create-roadmap-form"
            disabled={createRoadmapMutation.isPending}
          >
            {createRoadmapMutation.isPending ? "Đang tạo..." : "Lưu & Tiếp tục"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 p-3 sm:p-4 lg:p-5">
        <div className="rounded-2xl border border-border/40 bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/20 bg-background/70 p-2 text-primary">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Thiết kế lộ trình học</p>
              <p className="text-xs text-muted-foreground">
                Tạo khung lộ trình trước, sau đó thêm khóa học ở trang chi tiết.
              </p>
            </div>
          </div>
        </div>

        <form
          id="create-roadmap-form"
          className="space-y-6"
          onSubmit={(event) => void handleSubmitCreateRoadmap(event)}
        >
          <Card className="border-border/40 shadow-sm">
            <CardContent className="space-y-5 p-4 sm:p-5">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Tên lộ trình</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="VD: Backend JavaScript cho người mới"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Mô tả</Label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Mục tiêu, level, nội dung trọng tâm..."
                  className="min-h-28"
                />
              </div>

              <div className="pt-1 text-xs text-muted-foreground">
                Sau khi tạo xong, bạn sẽ được chuyển sang trang chi tiết để thêm
                khóa học vào lộ trình.
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </ManagementPageShell>
  );
}
