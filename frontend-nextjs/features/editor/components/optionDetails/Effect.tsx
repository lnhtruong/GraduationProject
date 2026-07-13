import type { EffectOption } from "@/features/editor/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  value: EffectOption;
  onChange: (value: EffectOption) => void;
}

const presetFilters: Array<{
  id: EffectOption["filter"];
  name: string;
  description: string;
  previewClass: string;
  values: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
  };
}> = [
  {
    id: "none",
    name: "Gốc",
    description: "Giữ màu tự nhiên",
    previewClass: "from-slate-200 via-orange-100 to-blue-200",
    values: { brightness: 100, contrast: 100, saturation: 100, hue: 0 },
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Mềm và ấm",
    previewClass: "from-amber-300 via-stone-200 to-orange-200",
    values: { brightness: 110, contrast: 90, saturation: 120, hue: 0 },
  },
  {
    id: "cinematic",
    name: "Điện ảnh",
    description: "Tương phản sâu",
    previewClass: "from-zinc-900 via-slate-600 to-amber-300",
    values: { brightness: 90, contrast: 120, saturation: 85, hue: 0 },
  },
  {
    id: "vivid",
    name: "Rực rỡ",
    description: "Màu nổi bật",
    previewClass: "from-emerald-400 via-sky-400 to-fuchsia-400",
    values: { brightness: 105, contrast: 110, saturation: 140, hue: 0 },
  },
  {
    id: "grayscale",
    name: "Đen trắng",
    description: "Tối giản",
    previewClass: "from-zinc-900 via-zinc-500 to-zinc-100",
    values: { brightness: 100, contrast: 110, saturation: 0, hue: 0 },
  },
  {
    id: "sepia",
    name: "Nâu cổ",
    description: "Tông ấm cổ điển",
    previewClass: "from-yellow-900 via-amber-500 to-stone-200",
    values: { brightness: 110, contrast: 90, saturation: 50, hue: 20 },
  },
  {
    id: "warm",
    name: "Ấm áp",
    description: "Da sáng hơn",
    previewClass: "from-orange-500 via-amber-200 to-rose-200",
    values: { brightness: 105, contrast: 105, saturation: 120, hue: 15 },
  },
  {
    id: "cool",
    name: "Lạnh",
    description: "Sạch và hiện đại",
    previewClass: "from-cyan-300 via-blue-500 to-indigo-900",
    values: { brightness: 95, contrast: 110, saturation: 110, hue: 200 },
  },
];

export default function EffectOptions({ value, onChange }: Props) {
  const applyFilter = (filter: (typeof presetFilters)[number]) => {
    onChange({ ...filter.values, filter: filter.id });
  };

  const resetToDefault = () => {
    onChange({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      filter: "none",
    });
  };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <section className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-semibold">Màu video</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Chọn nhanh hoặc tinh chỉnh thủ công.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetToDefault}>
            Đặt lại
          </Button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {presetFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => applyFilter(filter)}
              className={cn(
                "relative min-w-0 rounded-xl border border-border bg-background p-2 text-left transition hover:border-primary/60 hover:bg-accent/30",
                value.filter === filter.id &&
                  "border-primary bg-primary/10 ring-2 ring-primary/20",
              )}
            >
              <div
                className={cn(
                  "relative mb-2 h-12 rounded-lg bg-gradient-to-br",
                  filter.previewClass,
                )}
              >
                {value.filter === filter.id && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in duration-200">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="truncate text-sm font-semibold">{filter.name}</div>
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {filter.description}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="min-w-0 space-y-4 rounded-xl border border-border bg-background/70 p-3">
        <Label className="text-sm font-semibold">Tinh chỉnh</Label>
        <EffectSlider
          label="Độ sáng"
          value={value.brightness}
          suffix="%"
          min={0}
          max={200}
          onChange={(brightness) => onChange({ ...value, brightness })}
        />
        <EffectSlider
          label="Tương phản"
          value={value.contrast}
          suffix="%"
          min={0}
          max={200}
          onChange={(contrast) => onChange({ ...value, contrast })}
        />
        <EffectSlider
          label="Độ bão hòa"
          value={value.saturation}
          suffix="%"
          min={0}
          max={200}
          onChange={(saturation) => onChange({ ...value, saturation })}
        />
        <EffectSlider
          label="Sắc độ"
          value={value.hue}
          suffix="°"
          min={0}
          max={360}
          onChange={(hue) => onChange({ ...value, hue })}
        />
      </section>
    </div>
  );
}

function EffectSlider({
  label,
  value,
  suffix,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Badge variant="secondary" className="font-mono text-xs">
          {value}
          {suffix}
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        min={min}
        max={max}
        step={1}
      />
    </div>
  );
}
