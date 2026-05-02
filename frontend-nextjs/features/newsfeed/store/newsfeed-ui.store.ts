"use client";

import { create } from "zustand";

export type NewsfeedOptionBoxContentType = "course" | "comments";

interface NewsfeedUiState {
  isMenuOpen: boolean;
  isOptionBoxOpen: boolean;
  optionBoxContentType: NewsfeedOptionBoxContentType;
  activeVideoId: number | null;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  openOptionBox: (type: NewsfeedOptionBoxContentType) => void;
  closeOptionBox: () => void;
  setOptionBoxContentType: (type: NewsfeedOptionBoxContentType) => void;
  setActiveVideoId: (id: number | null) => void;
}

export const useNewsfeedUiStore = create<NewsfeedUiState>((set) => ({
  isMenuOpen: false,
  isOptionBoxOpen: false,
  optionBoxContentType: "course",
  activeVideoId: null,
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  openOptionBox: (type) =>
    set({ isOptionBoxOpen: true, optionBoxContentType: type }),
  closeOptionBox: () => set({ isOptionBoxOpen: false }),
  setOptionBoxContentType: (type) => set({ optionBoxContentType: type }),
  setActiveVideoId: (id) => set({ activeVideoId: id }),
}));
