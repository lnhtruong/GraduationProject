"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActivityQuizForm,
  type ActivityQuizFormHandle,
} from "./ActivityQuizForm";
import {
  useCreateLessonActivity,
  useCreateQuiz,
  useLessonActivitiesByLessonId,
} from "../api/course-management.hooks";
import { useVideoById } from "@/features/video/api/video.hooks";
import type { QuizEditorState } from "../types";
import {
  canCreateInVideoQuiz,
  createAssignmentPayload,
  createQuizPayload,
  generateTimestampOptions,
} from "../utils/activity-creation.utils";
import { ActivityDialogFooter } from "./ActivityCreationDialog/ActivityDialogFooter";
import { AssignmentForm } from "./ActivityCreationDialog/AssignmentForm";
import { InvalidVideoWarning } from "./ActivityCreationDialog/InvalidVideoWarning";
import { QuizModeSection } from "./ActivityCreationDialog/QuizModeSection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: number;
  lessonTitle: string;
  lessonVideoId?: number | null;
  userId?: number;
}

export function ActivityCreationDialog({
  open,
  onOpenChange,
  lessonId,
  lessonTitle,
  lessonVideoId,
  userId,
}: Props) {
  const router = useRouter();
  const [activityTab, setActivityTab] = useState<"quiz" | "assignment">("quiz");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [quizMode, setQuizMode] = useState<"in_video" | "outside_video">(
    "outside_video",
  );
  const [quizTimestamp, setQuizTimestamp] = useState("00:00:00.000");
  const quizFormRef = useRef<ActivityQuizFormHandle>(null);

  const { data: lessonActivities } = useLessonActivitiesByLessonId(lessonId);
  const { data: lessonVideo } = useVideoById(lessonVideoId ?? null);

  const createLessonActivityMutation = useCreateLessonActivity();
  const createQuizMutation = useCreateQuiz();

  const timestampOptions = useMemo(
    () => generateTimestampOptions(Number(lessonVideo?.duration ?? 0)),
    [lessonVideo?.duration],
  );

  const canUseInVideoQuiz = canCreateInVideoQuiz(
    Boolean(lessonVideoId),
    timestampOptions.length,
  );

  const handleCreateAssignment = async () => {
    const nextOrderIndex = (lessonActivities?.length ?? 0) + 1;
    const payload = createAssignmentPayload(
      lessonId,
      assignmentTitle,
      lessonTitle,
      nextOrderIndex,
      userId,
    );
    await createLessonActivityMutation.mutateAsync(payload);

    toast.success("Đã tạo bài tập");
    onOpenChange(false);
    router.refresh();
  };

  const handleCreateQuizFromPopup = async (state: QuizEditorState) => {
    if (quizMode === "in_video" && !canUseInVideoQuiz) {
      toast.error("Bài học chưa có video hợp lệ để tạo quiz trong video");
      return;
    }

    const nextOrderIndex = (lessonActivities?.length ?? 0) + 1;
    const createdActivity = await createLessonActivityMutation.mutateAsync({
      lessonId,
      activityType: "quiz",
      title: state.title.trim() || `Quiz: ${lessonTitle}`,
      description: state.description.trim() || "Activity quiz",
      orderIndex: nextOrderIndex,
      status: "draft",
      createdBy: userId,
    });

    const payload = createQuizPayload(
      state,
      createdActivity.id,
      quizMode,
      quizTimestamp,
    );

    await createQuizMutation.mutateAsync(payload);
    toast.success("Đã tạo quiz từ popup");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[96vw] max-w-none overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl sm:w-[94vw] lg:w-7xl">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="sticky top-0 z-10 border-b border-border/70 bg-linear-to-r from-background to-muted/20 px-4 py-4 text-left sm:px-6">
            <DialogTitle className="text-xl">Tạo hoạt động mới</DialogTitle>
            <DialogDescription>
              Tạo quiz đầy đủ ngay trong popup hoặc tạo activity bài tập.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
            <Tabs
              value={activityTab}
              onValueChange={(value) =>
                setActivityTab(value as "quiz" | "assignment")
              }
              className="w-full"
            >
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-border/60 bg-muted/40 p-1">
                <TabsTrigger value="quiz" className="rounded-lg">
                  Quiz
                </TabsTrigger>
                <TabsTrigger value="assignment" className="rounded-lg">
                  Bài tập
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quiz" className="space-y-4 pt-4">
                <QuizModeSection
                  quizMode={quizMode}
                  onQuizModeChange={setQuizMode}
                  quizTimestamp={quizTimestamp}
                  onTimestampChange={setQuizTimestamp}
                  canUseInVideoQuiz={canUseInVideoQuiz}
                  lessonVideoUrl={lessonVideo?.url}
                  lessonVideoDuration={Number(lessonVideo?.duration ?? 0)}
                />

                <InvalidVideoWarning
                  show={!canUseInVideoQuiz && quizMode === "in_video"}
                />

                <div className="rounded-2xl border border-border/60 bg-background p-3">
                  <ActivityQuizForm
                    ref={quizFormRef}
                    initialInVideo={quizMode === "in_video"}
                    defaultTimestamp={quizTimestamp}
                    onSubmit={handleCreateQuizFromPopup}
                  />
                </div>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4 pt-4">
                <AssignmentForm
                  assignmentTitle={assignmentTitle}
                  onTitleChange={setAssignmentTitle}
                  lessonTitle={lessonTitle}
                />
              </TabsContent>
            </Tabs>
          </div>

          <ActivityDialogFooter
            activityTab={activityTab}
            onCancel={() => onOpenChange(false)}
            onCreateAssignment={() => void handleCreateAssignment()}
            onCreateQuiz={() => void quizFormRef.current?.submit()}
            isAssignmentPending={createLessonActivityMutation.isPending}
            isQuizPending={createQuizMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
