import { useState } from 'react';
import EditorOptions from './EditorOptions';
import MascotOptions from './optionDetails/Mascot';
import VoiceOptions from './optionDetails/Voice';
import TextOptions from './optionDetails/Text';
import EffectOptions from './optionDetails/Effect';
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

// ============================================================================

// interface Props {
//   brightness: number;
//   contrast: number;
//   saturation: number;
//   hue: number;
//   onChange: (next: {
//     brightness: number;
//     contrast: number;
//     saturation: number;
//     hue: number;
//   }) => void;
// }

// export default function EditorRightPanel({
//   brightness,
//   contrast,
//   saturation,
//   hue,
//   onChange,
// }: Props) {
//   return (
//     <div className="col-span-3 bg-secondary rounded-md p-4 shadow-sm">
//       <h3 className="text-sm font-medium mb-3">Style / Effects</h3>

//       <div className="space-y-4">
//         <div>
//           <label className="block text-xs text-secondary-foreground mb-1">
//             Brightness
//           </label>
//           <input
//             type="range"
//             min={0}
//             max={200}
//             value={brightness}
//             onChange={(e) =>
//               onChange({
//                 brightness: Number(e.target.value),
//                 contrast,
//                 saturation,
//                 hue,
//               })
//             }
//             className="w-full"
//           />
//         </div>

//         <div>
//           <label className="block text-xs text-secondary-foreground mb-1">
//             Contrast
//           </label>
//           <input
//             type="range"
//             min={0}
//             max={200}
//             value={contrast}
//             onChange={(e) =>
//               onChange({
//                 brightness,
//                 contrast: Number(e.target.value),
//                 saturation,
//                 hue,
//               })
//             }
//             className="w-full"
//           />
//         </div>

//         <div>
//           <label className="block text-xs text-secondary-foreground mb-1">
//             Saturation
//           </label>
//           <input
//             type="range"
//             min={0}
//             max={200}
//             value={saturation}
//             onChange={(e) =>
//               onChange({
//                 brightness,
//                 contrast,
//                 saturation: Number(e.target.value),
//                 hue,
//               })
//             }
//             className="w-full"
//           />
//         </div>

//         <div>
//           <label className="block text-xs text-secondary-foreground mb-1">
//             Hue (Color)
//           </label>
//           <input
//             type="range"
//             min={0}
//             max={360}
//             value={hue}
//             onChange={(e) =>
//               onChange({
//                 brightness,
//                 contrast,
//                 saturation,
//                 hue: Number(e.target.value),
//               })
//             }
//             className="w-full"
//           />
//           <span className="text-xs text-muted-foreground">{hue}°</span>
//         </div>

//         <div>
//           <label className="block text-xs text-secondary-foreground mb-1">
//             Filters
//           </label>
//           <div className="flex flex-wrap gap-2">
//             <button
//               className="px-3 py-1 bg-primary rounded text-sm hover:bg-primary/80"
//               onClick={() =>
//                 onChange({ brightness: 110, contrast: 120, saturation: 120, hue: 0 })
//               }
//             >
//               Vintage
//             </button>
//             <button
//               className="px-3 py-1 bg-primary rounded text-sm hover:bg-primary/80"
//               onClick={() =>
//                 onChange({ brightness: 90, contrast: 120, saturation: 90, hue: 0 })
//               }
//             >
//               Cinematic
//             </button>
//             <button
//               className="px-3 py-1 bg-primary rounded text-sm hover:bg-primary/80"
//               onClick={() =>
//                 onChange({ brightness: 105, contrast: 110, saturation: 150, hue: 25 })
//               }
//             >
//               Warm
//             </button>
//             <button
//               className="px-3 py-1 bg-primary rounded text-sm hover:bg-primary/80"
//               onClick={() =>
//                 onChange({ brightness: 95, contrast: 110, saturation: 120, hue: 200 })
//               }
//             >
//               Cool
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
