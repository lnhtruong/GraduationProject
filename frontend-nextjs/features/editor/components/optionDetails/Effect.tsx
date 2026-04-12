import type { EffectOption } from '@/features/editor/types';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Props {
  value: EffectOption;
  onChange: (value: EffectOption) => void;
}

// Filter effect có sẵn
const presetFilters: Array<{
  id: EffectOption['filter'];
  name: string;
  values: { brightness: number; contrast: number; saturation: number; hue: number };
}> = [
  { 
    id: 'none', 
    name: 'Gốc',
    values: { brightness: 100, contrast: 100, saturation: 100, hue: 0 }
  },
  { 
    id: 'vintage', 
    name: 'Vintage',
    values: { brightness: 110, contrast: 90, saturation: 120, hue: 0 }
  },
  { 
    id: 'cinematic', 
    name: 'Điện ảnh',
    values: { brightness: 90, contrast: 120, saturation: 85, hue: 0 }
  },
  { 
    id: 'vivid', 
    name: 'Sống động',
    values: { brightness: 105, contrast: 110, saturation: 140, hue: 0 }
  },
  { 
    id: 'grayscale', 
    name: 'Đen trắng',
    values: { brightness: 100, contrast: 110, saturation: 0, hue: 0 }
  },
  { 
    id: 'sepia', 
    name: 'Nâu cổ',
    values: { brightness: 110, contrast: 90, saturation: 50, hue: 20 }
  },
  { 
    id: 'warm', 
    name: 'Ấm áp',
    values: { brightness: 105, contrast: 105, saturation: 120, hue: 15 }
  },
  { 
    id: 'cool', 
    name: 'Lạnh lẽo',
    values: { brightness: 95, contrast: 110, saturation: 110, hue: 200 }
  },
];

export default function EffectOptions({ value, onChange }: Props) {
  const applyFilter = (filter: typeof presetFilters[number]) => {
    onChange({ ...filter.values, filter: filter.id });
  };

  const resetToDefault = () => {
    onChange({ brightness: 100, contrast: 100, saturation: 100, hue: 0, filter: 'none' });
  };

  return (
    <div className="space-y-4">
      {/* Custom Adjustments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-semibold">Tùy chỉnh chi tiết</Label>
          <Button variant="ghost" size="sm" onClick={resetToDefault}>
            Đặt lại
          </Button>
        </div>

        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Độ sáng</Label>
            <Badge variant="secondary" className="text-xs font-mono">
              {value.brightness}%
            </Badge>
          </div>
          <Slider
            value={[value.brightness]}
            onValueChange={([brightness]) =>
              onChange({ ...value, brightness})
            }
            min={0}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Độ tương phản</Label>
            <Badge variant="secondary" className="text-xs font-mono">
              {value.contrast}%
            </Badge>
          </div>
          <Slider
            value={[value.contrast]}
            onValueChange={([contrast]) =>
              onChange({ ...value, contrast})
            }
            min={0}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Độ bão hòa</Label>
            <Badge variant="secondary" className="text-xs font-mono">
              {value.saturation}%
            </Badge>
          </div>
          <Slider
            value={[value.saturation]}
            onValueChange={([saturation]) =>
              onChange({ ...value, saturation})
            }
            min={0}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Hue */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Màu sắc (Hue)</Label>
            <Badge variant="secondary" className="text-xs font-mono">
              {value.hue}°
            </Badge>
          </div>
          <Slider
            value={[value.hue]}
            onValueChange={([hue]) =>
              onChange({ ...value, hue})
            }
            min={0}
            max={360}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Preset Filters */}
      <div className="space-y-5 pt-4 border-t">
        <Label className="text-sm font-semibold mb-3 block">Bộ lọc có sẵn</Label>
        <div className="grid grid-cols-2 gap-2">
          {presetFilters.map((filter) => (
        <Card
          key={filter.id}
          className={`p-3 cursor-pointer transition-all hover:shadow-md flex items-center justify-center ${
            value.filter === filter.id
          ? 'ring-2 ring-primary bg-primary/5'
          : 'hover:bg-muted/50'
          }`}
          onClick={() => applyFilter(filter)}
        >
          <span className="text-xs font-medium text-center">{filter.name}</span>
        </Card>
          ))}
        </div>
      </div>
    </div>
  );
}