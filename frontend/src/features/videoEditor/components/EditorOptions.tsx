import { Film, Mic, Type, Sparkles } from 'lucide-react';
import type { OptionType } from '../types';
import { Button } from '@/components/ui/button';

interface Props {
  activeOption: OptionType;
  onOptionChange: (option: OptionType) => void;
}

const options = [
  { id: 'effect' as const, label: 'Hiệu ứng', icon: Sparkles },
  { id: 'text' as const, label: 'Văn bản', icon: Type },
  { id: 'mascot' as const, label: 'Mascot', icon: Film },
  { id: 'voice' as const, label: 'Giọng nói', icon: Mic },
];

export default function EditorOptions({ activeOption, onOptionChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={activeOption === id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onOptionChange(id)}
          className="flex flex-col items-center justify-center h-auto py-3 gap-1"
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
}