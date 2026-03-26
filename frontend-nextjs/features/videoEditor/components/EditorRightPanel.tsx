"use client";

import { useState, useEffect } from "react";
import EditorOptions from "@/features/videoEditor/components/EditorOptions";
import MascotOptions from "@/features/videoEditor/components/optionDetails/Mascot";
import VoiceOptions from "@/features/videoEditor/components/optionDetails/Voice";
import TextOptions from "@/features/videoEditor/components/optionDetails/Text";
import EffectOptions from "@/features/videoEditor/components/optionDetails/Effect";
import type {
  OptionType,
  MascotOption,
  VoiceOption,
  TextOption,
  EffectOption,
  LayerItem,
} from "@/features/videoEditor/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  effect: EffectOption;
  onEffectChange?: (effect: EffectOption) => void;
  mascot: MascotOption;
  onMascotChange?: (mascot: MascotOption) => void;
  onMascotApply?: () => void;
  isApplyingMascot?: boolean;
  videoFile?: File | null;
  mascotProgress?: string;
  voice: VoiceOption;
  onVoiceChange?: (voice: VoiceOption) => void;
  layers: LayerItem[];
  onTextAdd: (text: TextOption) => void;
  onTextUpdate: (id: string, updates: Partial<TextOption> | TextOption) => void;
  onTextRemove: (id: string) => void;
  selectedTextId?: string | null;
  onTextSelect?: (id: string | null) => void;
  activeOption?: OptionType;
  onActiveOptionChange?: (option: OptionType) => void;
}

export default function EditorRightPanel({
  effect,
  onEffectChange,
  mascot,
  onMascotChange,
  onMascotApply,
  isApplyingMascot,
  mascotProgress,
  videoFile,
  voice,
  onVoiceChange,
  layers,
  onTextAdd,
  onTextUpdate,
  onTextRemove,
  selectedTextId,
  onTextSelect,
  activeOption: controlledActiveOption,
  onActiveOptionChange,
}: Props) {
  const textOverlays = layers
    .filter((l) => l.type === "text")
    .map((l) => l.data as TextOption);

  // ===== Option selection
  const [uncontrolledActiveOption, setUncontrolledActiveOption] =
    useState<OptionType>("effect");
  const activeOption = controlledActiveOption ?? uncontrolledActiveOption;
  const setActiveOption = (option: OptionType) => {
    if (onActiveOptionChange) {
      onActiveOptionChange(option);
      return;
    }
    setUncontrolledActiveOption(option);
  };

  // ===== Text editor
  // Auto-select first text when switching to text tab
  useEffect(() => {
    if (activeOption === "text" && textOverlays.length > 0 && !selectedTextId) {
      onTextSelect?.(textOverlays[0].id);
    }
  }, [activeOption, textOverlays, selectedTextId, onTextSelect]);

  // Reset selectedTextId nếu text bị xóa
  useEffect(() => {
    if (selectedTextId && !textOverlays.find((t) => t.id === selectedTextId)) {
      // Text đã bị xóa, chọn text đầu tiên hoặc null
      onTextSelect?.(textOverlays[0]?.id || null);
    }
  }, [selectedTextId, textOverlays, onTextSelect]);

  // Get current text or create new default
  const currentText = textOverlays.find((t) => t.id === selectedTextId) || {
    id: crypto.randomUUID(),
    text: "",
    position: { x: 50, y: 50 },
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Arial",
    fontWeight: "bold" as const,
    fontStyle: "normal" as const,
    textDecoration: "none" as const,
    textAlign: "center" as const,
  };

  // Handle text changes
  const handleTextChange = (newValue: TextOption) => {
    if (selectedTextId && textOverlays.find((t) => t.id === selectedTextId)) {
      // Update existing text
      onTextUpdate(selectedTextId, newValue);
    } else {
      // Add new text
      onTextAdd(newValue);
      onTextSelect?.(newValue.id);
    }
  };

  const handleTextAdd = () => {
    const newText: TextOption = {
      id: crypto.randomUUID(),
      text: "New Text",
      position: { x: 50, y: 50 },
      fontSize: 32,
      color: "#FFFFFF",
      fontFamily: "Arial",
      fontWeight: "bold",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "center",
      startTime: 0,
      duration: 5000, // ← đổi từ 0 thành 5000
      width: 300,
      height: 100,
    };
    onTextAdd(newText);
    onTextSelect?.(newText.id);
  };

  const handleTextRemove = () => {
    if (selectedTextId) {
      onTextRemove(selectedTextId);
      // useEffect sẽ tự động chọn text tiếp theo
    }
  };

  return (
    <aside className="h-full bg-card rounded-xl shadow-sm flex flex-col border border-border/70 overflow-hidden">
      <div className="p-4 border-b shrink-0">
        <EditorOptions
          activeOption={activeOption}
          onOptionChange={setActiveOption}
        />
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {activeOption === "effect" && onEffectChange && (
            <EffectOptions value={effect} onChange={onEffectChange} />
          )}

          {activeOption === "text" && (
            <>
              <TextOptions
                value={currentText}
                onChange={handleTextChange}
                onAdd={handleTextAdd}
                onRemove={selectedTextId ? handleTextRemove : undefined}
              />
            </>
          )}

          {activeOption === "mascot" && onMascotChange && (
            <MascotOptions
              value={mascot}
              onChange={onMascotChange}
              onApply={onMascotApply}
              isApplying={isApplyingMascot}
              mascotProgress={mascotProgress}
              videoFile={videoFile}
            />
          )}

          {activeOption === "voice" && onVoiceChange && (
            <VoiceOptions value={voice} onChange={onVoiceChange} />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
