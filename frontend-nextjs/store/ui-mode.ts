import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "learner" | "teacher";

interface UiModeState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

export const useUiModeStore = create<UiModeState>()(
  persist(
    (set, get) => ({
      viewMode: "learner",
      setViewMode: (viewMode) => set({ viewMode }),
      toggleViewMode: () =>
        set({
          viewMode: get().viewMode === "teacher" ? "learner" : "teacher",
        }),
    }),
    {
      name: "ui-mode-storage",
      partialize: (state) => ({ viewMode: state.viewMode }),
    },
  ),
);
