import { useState } from 'react';
import EditorOptions from '@/features/videoEditor/components/EditorOptions';
import MascotOptions from '@/features/videoEditor/components/optionDetails/Mascot';
import VoiceOptions from '@/features/videoEditor/components/optionDetails/Voice';
import TextOptions from '@/features/videoEditor/components/optionDetails/Text';
import EffectOptions from '@/features/videoEditor/components/optionDetails/Effect';
import type {
  OptionType,
  MascotOption,
  VoiceOption,
  TextOption,
  EffectOption,
} from '@/features/videoEditor/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  effect: EffectOption;
  onEffectChange?: (effect: EffectOption) => void;
  mascot: MascotOption;
  onMascotChange?: (mascot: MascotOption) => void;
  voice: VoiceOption;
  onVoiceChange?: (voice: VoiceOption) => void;
  textOverlays: TextOption[];
  onTextAdd: (text: TextOption) => void;
  onTextUpdate: (id: string, updates: Partial<TextOption>) => void;
  onTextRemove: (id: string) => void;
}

export default function EditorRightPanel({
  effect,
  onEffectChange,
  mascot,
  onMascotChange,
  voice,
  onVoiceChange,
  textOverlays,
  onTextAdd,
  onTextUpdate,
  onTextRemove,
}: Props) {
  // ===== Option selection
  const [activeOption, setActiveOption] = useState<OptionType>('effect');

  // ===== Text editor
  const [currentTextId, setCurrentTextId] = useState<string | null>(
    textOverlays[0]?.id || null
  );

  const currentText = textOverlays.find(t => t.id === currentTextId) || {
    id: crypto.randomUUID(),
    text: '',
    position: { x: 50, y: 50 },
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'Arial',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  };

  const handleTextChange = (updates: Partial<TextOption>) => {
    if (currentTextId && textOverlays.find(t => t.id === currentTextId)) {
      // Update existing
      onTextUpdate(currentTextId, updates);
    } else {
      // Add new
      const newText = { ...currentText, ...updates };
      onTextAdd(newText);
      setCurrentTextId(newText.id);
    }
  };

  const handleTextAdd = () => {
    const newText: TextOption = {
      id: crypto.randomUUID(),
      text: 'New Text',
      position: { x: 50, y: 50 },
      fontSize: 32,
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
    };
    onTextAdd(newText);
    setCurrentTextId(newText.id);
  };

  const handleTextRemove = () => {
    if (currentTextId) {
      onTextRemove(currentTextId);
      const remaining = textOverlays.filter(t => t.id !== currentTextId);
      setCurrentTextId(remaining[0]?.id || null);
    }
  };

  return (
    <aside className="col-span-3 bg-card rounded-md shadow-sm flex flex-col h-full border">
      <div className="p-4 border-b">
        <EditorOptions
          activeOption={activeOption}
          onOptionChange={setActiveOption}
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeOption === 'mascot' && (
            <MascotOptions value={mascot} onChange={onMascotChange} />
          )}
          
          {activeOption === 'voice' && (
            <VoiceOptions value={voice} onChange={onVoiceChange} />
          )}
          
          {activeOption === 'text' && (
            <TextOptions 
              value={currentText}
              onChange={handleTextChange}
              onAdd={handleTextAdd}
              onRemove={textOverlays.length > 0 ? handleTextRemove : undefined}
            />
          )}
          
          {activeOption === 'effect' && (
            <EffectOptions value={effect} onChange={onEffectChange} />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}