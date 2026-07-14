"use client";

import { create } from "zustand";

export type NewsfeedOptionBoxContentType = "course" | "comments";

interface NewsfeedUiState {
  isMenuOpen: boolean;
  isOptionBoxOpen: boolean;
  optionBoxContentType: NewsfeedOptionBoxContentType;
  activeVideoId: number | null;
  isGlobalPaused: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  openOptionBox: (type: NewsfeedOptionBoxContentType) => void;
  closeOptionBox: () => void;
  setOptionBoxContentType: (type: NewsfeedOptionBoxContentType) => void;
  setActiveVideoId: (id: number | null) => void;
  setGlobalPaused: (paused: boolean) => void;
  toggleGlobalPaused: () => void;
}

export const useNewsfeedUiStore = create<NewsfeedUiState>((set) => ({
  isMenuOpen: false,
  isOptionBoxOpen: false,
  optionBoxContentType: "course",
  activeVideoId: null,
  isGlobalPaused: false,
  openMenu: () => set({ isMenuOpen: true, isOptionBoxOpen: false }),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleMenu: () =>
    set((state) => ({
      isMenuOpen: !state.isMenuOpen,
      isOptionBoxOpen: state.isMenuOpen ? state.isOptionBoxOpen : false,
    })),
  openOptionBox: (type) =>
    set({ isMenuOpen: false, isOptionBoxOpen: true, optionBoxContentType: type }),
  closeOptionBox: () => set({ isOptionBoxOpen: false }),
  setOptionBoxContentType: (type) => set({ optionBoxContentType: type }),
  setActiveVideoId: (id) => set({ activeVideoId: id }),
  setGlobalPaused: (paused) => set({ isGlobalPaused: paused }),
  toggleGlobalPaused: () => set((state) => ({ isGlobalPaused: !state.isGlobalPaused })),
}));
