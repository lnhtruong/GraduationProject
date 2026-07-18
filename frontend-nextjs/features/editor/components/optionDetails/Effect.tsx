"use client";

import type { EffectOption } from "@/features/editor/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Check, RotateCcw } from "lucide-react";

interface Props {
  value: EffectOption;
  onChange: (value: EffectOption) => void;
}

const presetFilters: Array<{
  id: EffectOption["filter"];
  name: string;
  description: string;
  swatchClass: string;
  values: Pick<EffectOption, "brightness" | "contrast" | "saturation">;
}> = [
  {
    id: "none",
    name: "Gốc",
    description: "Tự nhiên",
    swatchClass: "from-zinc-200 via-orange-100 to-sky-200",
    values: { brightness: 100, contrast: 100, saturation: 100 },
  },
  {
    id: "vintage",
    name: "Mềm",
    description: "Sáng nhẹ",
    swatchClass: "from-amber-200 via-stone-100 to-orange-200",
    values: { brightness: 110, contrast: 90, saturation: 115 },
  },
  {
    id: "cinematic",
    name: "Điện ảnh",
    description: "Sâu màu",
    swatchClass: "from-zinc-900 via-slate-600 to-amber-300",
    values: { brightness: 90, contrast: 120, saturation: 85 },
  },
  {
    id: "vivid",
    name: "Rực rỡ",
    description: "Nổi màu",
    swatchClass: "from-emerald-400 via-sky-400 to-fuchsia-400",
    values: { brightness: 105, contrast: 110, saturation: 140 },
  },
  {
    id: "grayscale",
    name: "Đen trắng",
    description: "Tối giản",
    swatchClass: "from-zinc-900 via-zinc-500 to-zinc-100",
    values: { brightness: 100, contrast: 110, saturation: 0 },
  },
];

export default function EffectOptions({ value, onChange }: Props) {
  const applyFilter = (filter: (typeof presetFilters)[number]) => {
    onChange({ ...value, ...filter.values, hue: 0, filter: filter.id });
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
    <div className="min-w-0 space-y-3 overflow-x-hidden">
      <section className="min-w-0 rounded-xl border border-border bg-background p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Label className="text-sm font-semibold">Bộ màu</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Chọn nhanh sắc độ cho video.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl"
            onClick={resetToDefault}
            title="Đặt lại"
            aria-label="Đặt lại hiệu ứng"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2">
          {presetFilters.map((filter) => {
            const selected = value.filter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => applyFilter(filter)}
                className={cn(
                  "flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-2 text-left transition hover:border-primary/60 hover:bg-accent/30",
                  selected && "border-primary bg-primary/10 ring-2 ring-primary/15",
                )}
              >
                <span
                  className={cn(
                    "h-10 w-16 shrink-0 rounded-lg bg-gradient-to-br",
                    filter.swatchClass,
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {filter.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {filter.description}
                  </span>
                </span>
                {selected ? (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="min-w-0 space-y-4 rounded-xl border border-border bg-background p-3">
        <Label className="text-sm font-semibold">Thông số</Label>
        <EffectSlider
          label="Độ sáng"
          value={value.brightness}
          suffix="%"
          min={0}
          max={200}
          onChange={(brightness) =>
            onChange({ ...value, brightness, hue: 0 })
          }
        />
        <EffectSlider
          label="Tương phản"
          value={value.contrast}
          suffix="%"
          min={0}
          max={200}
          onChange={(contrast) => onChange({ ...value, contrast, hue: 0 })}
        />
        <EffectSlider
          label="Bão hòa"
          value={value.saturation}
          suffix="%"
          min={0}
          max={200}
          onChange={(saturation) =>
            onChange({ ...value, saturation, hue: 0 })
          }
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
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
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
