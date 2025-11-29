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
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  onChange: (next: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
  }) => void;
  
  onMascotChange?: (mascot: MascotOption) => void;
  onVoiceChange?: (voice: VoiceOption) => void;
  onTextChange?: (text: TextOption) => void;
}

export default function EditorRightPanel({
  brightness,
  contrast,
  saturation,
  hue,
  onChange,
  onMascotChange,
  onVoiceChange,
  onTextChange,
}: Props) {
  const [activeOption, setActiveOption] = useState<OptionType>('effect');
  
  const [mascotOption, setMascotOption] = useState<MascotOption>({
    type: 'none',
  });
  
  const [voiceOption, setVoiceOption] = useState<VoiceOption>({
    type: 'none',
    speed: 1,
    volume: 100,
    pitch: 0,
  });
  
  const [textOption, setTextOption] = useState<TextOption>({
    id: crypto.randomUUID(),
    text: '',
    position: { x: 50, y: 50 },
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    textAlign: 'center',
  });

  const [effectsOption, setEffectsOption] = useState<EffectOption>({
    brightness,
    contrast,
    saturation,
    hue,
    filter: 'none',
  });

  const handleMascotChange = (value: MascotOption) => {
    setMascotOption(value);
    onMascotChange?.(value);
  };

  const handleVoiceChange = (value: VoiceOption) => {
    setVoiceOption(value);
    onVoiceChange?.(value);
  };

  const handleTextChange = (value: TextOption) => {
    setTextOption(value);
    onTextChange?.(value);
  };

  const handleEffectsChange = (value: EffectOption) => {
    setEffectsOption(value);
    onChange({
      brightness: value.brightness,
      contrast: value.contrast,
      saturation: value.saturation,
      hue: value.hue,
    });
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
            <MascotOptions value={mascotOption} onChange={handleMascotChange} />
          )}
          
          {activeOption === 'voice' && (
            <VoiceOptions value={voiceOption} onChange={handleVoiceChange} />
          )}
          
          {activeOption === 'text' && (
            <TextOptions value={textOption} onChange={handleTextChange} />
          )}
          
          {activeOption === 'effect' && (
            <EffectOptions
              value={effectsOption}
              onChange={handleEffectsChange}
            />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}