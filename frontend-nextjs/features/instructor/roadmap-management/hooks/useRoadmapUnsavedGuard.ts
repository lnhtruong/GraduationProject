import { useEffect } from "react";

interface UseRoadmapUnsavedGuardInput {
  hasUnsavedChanges: boolean;
  message: string;
}

export function useRoadmapUnsavedGuard({
  hasUnsavedChanges,
  message,
}: UseRoadmapUnsavedGuardInput) {
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    let allowBrowserBack = false;

    window.history.pushState(
      { roadmapUnsavedGuard: true },
      "",
      window.location.href,
    );

    const handlePopState = () => {
      if (allowBrowserBack) {
        return;
      }

      const confirmed = window.confirm(message);

      if (confirmed) {
        allowBrowserBack = true;
        window.history.back();
        return;
      }

      window.history.pushState(
        { roadmapUnsavedGuard: true },
        "",
        window.location.href,
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges, message]);

  return {
    confirmLeaveIfDirty: () => {
      if (!hasUnsavedChanges) {
        return true;
      }

      return window.confirm(message);
    },
  };
}
