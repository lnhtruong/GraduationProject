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
  text: TextOption;
  onTextChange?: (text: TextOption) => void;
}

export default function EditorRightPanel({
  effect,
  onEffectChange,
  mascot,
  onMascotChange,
  voice,
  onVoiceChange,
  text,
  onTextChange,
}: Props) {
  const [activeOption, setActiveOption] = useState<OptionType>('effect');

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
            <TextOptions value={text} onChange={onTextChange} />
          )}
          
          {activeOption === 'effect' && (
            <EffectOptions value={effect} onChange={onEffectChange} />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}