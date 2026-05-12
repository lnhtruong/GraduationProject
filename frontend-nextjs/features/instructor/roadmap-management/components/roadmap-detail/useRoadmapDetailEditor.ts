import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useInstructorCourses } from "@/features/instructor/course-management/api/course-management.hooks";
import {
  useAddRoadmapCourse,
  useDeleteRoadmap,
  useInstructorRoadmapById,
  useRemoveRoadmapCourse,
  useUpdateRoadmap,
  useUpdateRoadmapCourse,
} from "../../api/roadmap-management.hooks";
import type { InstructorRoadmapCourse } from "../../types";
import { buildRoadmapChangeSet } from "../../utils/roadmap-detail.utils";
import { useRoadmapUnsavedGuard } from "../../hooks/useRoadmapUnsavedGuard";

interface FormState {
  roadmapId: number | null;
  name: string;
  description: string;
}

export function useRoadmapDetailEditor(roadmapId: number) {
  const router = useRouter();
  const { user } = useAuth();

  const { data: roadmap, isLoading } = useInstructorRoadmapById(
    roadmapId,
    true,
  );
  const { data: courses, isLoading: coursesLoading } = useInstructorCourses(
    { page: 1, limit: 100 },
    Boolean(user?.id),
  );

  const updateRoadmapMutation = useUpdateRoadmap();
  const deleteRoadmapMutation = useDeleteRoadmap();
  const addRoadmapCourseMutation = useAddRoadmapCourse();
  const updateRoadmapCourseMutation = useUpdateRoadmapCourse();
  const removeRoadmapCourseMutation = useRemoveRoadmapCourse();

  const [formState, setFormState] = useState<FormState>({
    roadmapId: null,
    name: "",
    description: "",
  });
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [deleteRoadmapOpen, setDeleteRoadmapOpen] = useState(false);
  const [activeDragItemId, setActiveDragItemId] = useState<string | null>(null);
  const [draftRoadmapCourses, setDraftRoadmapCourses] = useState<
    InstructorRoadmapCourse[] | null
  >(null);
  const [isApplyingCourseChanges, setIsApplyingCourseChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const initialRoadmapCourses = useMemo(() => {
    const sorted = [...(roadmap?.roadmapCourses ?? [])].sort((left, right) => {
      const leftOrder = left.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.orderIndex ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });

    return sorted.map((item, index) => ({
      ...item,
      orderIndex: index + 1,
    }));
  }, [roadmap?.roadmapCourses]);

  const roadmapCourses = draftRoadmapCourses ?? initialRoadmapCourses;

  const activeRoadmapId = roadmap?.id ?? null;
  const name =
    formState.roadmapId === activeRoadmapId
      ? formState.name
      : (roadmap?.name ?? "");
  const description =
    formState.roadmapId === activeRoadmapId
      ? formState.description
      : (roadmap?.description ?? "");

  const attachedCourseIds = useMemo(
    () => new Set(roadmapCourses.map((item) => item.courseId).filter(Boolean)),
    [roadmapCourses],
  );

  const availableCourses = useMemo(() => {
    const keyword = courseSearch.trim().toLowerCase();
    return (courses ?? []).filter((course) => {
      if (attachedCourseIds.has(course.id)) {
        return false;
      }
      if (!keyword) {
        return true;
      }

      return (
        course.name.toLowerCase().includes(keyword) ||
        course.description.toLowerCase().includes(keyword)
      );
    });
  }, [attachedCourseIds, courseSearch, courses]);

  const activeDragCourseItem = useMemo(
    () =>
      activeDragItemId
        ? roadmapCourses.find((item) => item.id.toString() === activeDragItemId)
        : undefined,
    [activeDragItemId, roadmapCourses],
  );

  const changeSet = useMemo(() => {
    if (!roadmap) {
      return null;
    }

    return buildRoadmapChangeSet({
      initialRoadmapCourses,
      roadmapCourses,
      roadmapName: roadmap.name,
      roadmapDescription: roadmap.description,
      name,
      description,
    });
  }, [description, initialRoadmapCourses, name, roadmap, roadmapCourses]);

  const hasUnsavedChanges = Boolean(
    changeSet &&
    (changeSet.hasRoadmapInfoChanged || changeSet.hasCourseListChanged),
  );

  const { confirmLeaveIfDirty } = useRoadmapUnsavedGuard({
    hasUnsavedChanges,
    message:
      "Bạn có thay đổi chưa lưu. Nếu rời trang bây giờ, các thay đổi sẽ bị mất. Vẫn tiếp tục?",
  });

  const handleBackToRoadmapList = () => {
    if (!confirmLeaveIfDirty()) {
      return;
    }

    router.push("/instructor/roadmaps");
  };

  const handleSaveRoadmap = async () => {
    if (!roadmap || !changeSet) {
      return;
    }

    if (!changeSet.hasRoadmapInfoChanged && !changeSet.hasCourseListChanged) {
      toast.info("Không có thay đổi để lưu");
      return;
    }

    setIsApplyingCourseChanges(true);

    try {
      if (changeSet.hasRoadmapInfoChanged) {
        await updateRoadmapMutation.mutateAsync({
          id: roadmap.id,
          data: {
            userId: user?.id,
            name: changeSet.normalizedName,
            description: changeSet.normalizedDescription || undefined,
          },
        });
      }

      for (const courseId of changeSet.removedCourseIds) {
        await removeRoadmapCourseMutation.mutateAsync({
          roadmapId: roadmap.id,
          courseId,
        });
      }

      for (const item of changeSet.addedCourses) {
        await addRoadmapCourseMutation.mutateAsync({
          roadmapId: roadmap.id,
          data: {
            courseId: item.courseId as number,
            orderIndex: item.orderIndex ?? undefined,
          },
        });
      }

      if (changeSet.hasCourseListChanged) {
        for (let index = 0; index < roadmapCourses.length; index += 1) {
          const item = roadmapCourses[index];
          if (!item.courseId) {
            continue;
          }

          await updateRoadmapCourseMutation.mutateAsync({
            roadmapId: roadmap.id,
            courseId: item.courseId,
            data: {
              courseId: item.courseId,
              orderIndex: index + 1,
            },
          });
        }
      }

      setDraftRoadmapCourses(null);
      if (changeSet.hasRoadmapInfoChanged || changeSet.hasCourseListChanged) {
        router.refresh();
      }
    } finally {
      setIsApplyingCourseChanges(false);
    }
  };

  const handleSubmitRoadmapForm = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    await handleSaveRoadmap();
  };

  const handleDeleteRoadmap = () => {
    if (!roadmap) {
      return;
    }
    setDeleteRoadmapOpen(true);
  };

  const handleConfirmDeleteRoadmap = async () => {
    if (!roadmap) {
      return;
    }

    await deleteRoadmapMutation.mutateAsync(roadmap.id);
    setDeleteRoadmapOpen(false);
    router.push("/instructor/roadmaps");
    router.refresh();
  };

  const handleMoveCourse = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= roadmapCourses.length) {
      return;
    }

    setDraftRoadmapCourses((previousCourses) => {
      const nextCourses = [...(previousCourses ?? roadmapCourses)];
      const [movedCourse] = nextCourses.splice(index, 1);
      nextCourses.splice(targetIndex, 0, movedCourse);

      return nextCourses.map((item, itemIndex) => ({
        ...item,
        orderIndex: itemIndex + 1,
      }));
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragItemId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setDraftRoadmapCourses((previousCourses) => {
      const baseCourses = [...(previousCourses ?? roadmapCourses)];
      const oldIndex = baseCourses.findIndex(
        (item) => item.id.toString() === active.id.toString(),
      );
      const newIndex = baseCourses.findIndex(
        (item) => item.id.toString() === over.id.toString(),
      );

      if (oldIndex < 0 || newIndex < 0) {
        return baseCourses;
      }

      return arrayMove(baseCourses, oldIndex, newIndex).map((item, index) => ({
        ...item,
        orderIndex: index + 1,
      }));
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItemId(event.active.id.toString());
  };

  const handleDragCancel = () => {
    setActiveDragItemId(null);
  };

  const handleAddCourse = (courseId: number) => {
    setDraftRoadmapCourses((previousCourses) => {
      const baseCourses = previousCourses ?? roadmapCourses;
      if (baseCourses.some((item) => item.courseId === courseId)) {
        return baseCourses;
      }

      const course = courses?.find((item) => item.id === courseId);
      return [
        ...baseCourses,
        {
          id: -Date.now(),
          roadmapId: roadmap?.id,
          courseId,
          orderIndex: baseCourses.length + 1,
          course,
        },
      ];
    });
    setAddCourseOpen(false);
  };

  const handleRemoveCourse = (courseId: number) => {
    setDraftRoadmapCourses((previousCourses) => {
      const nextCourses = (previousCourses ?? roadmapCourses).filter(
        (item) => item.courseId !== courseId,
      );

      return nextCourses.map((item, index) => ({
        ...item,
        orderIndex: index + 1,
      }));
    });
  };

  return {
    roadmap,
    isLoading,
    coursesLoading,
    name,
    description,
    roadmapCourses,
    activeDragCourseItem,
    availableCourses,
    addCourseOpen,
    courseSearch,
    deleteRoadmapOpen,
    sensors,
    isSaving: updateRoadmapMutation.isPending || isApplyingCourseChanges,
    isDeleting: deleteRoadmapMutation.isPending,
    setAddCourseOpen,
    setCourseSearch,
    setDeleteRoadmapOpen,
    handleBackToRoadmapList,
    handleDeleteRoadmap,
    handleConfirmDeleteRoadmap,
    handleSubmitRoadmapForm,
    handleMoveCourse,
    handleRemoveCourse,
    handleAddCourse,
    handleDragStart,
    handleDragCancel,
    handleDragEnd,
    setName: (value: string) =>
      setFormState({
        roadmapId: activeRoadmapId,
        name: value,
        description,
      }),
    setDescription: (value: string) =>
      setFormState({
        roadmapId: activeRoadmapId,
        name,
        description: value,
      }),
  };
}
