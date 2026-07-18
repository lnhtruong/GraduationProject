"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { TextOption } from "@/features/editor/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  value: TextOption;
  onChange: (value: TextOption) => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

const presetColors = [
  { name: "Trắng", value: "#FFFFFF" },
  { name: "Đen", value: "#000000" },
  { name: "Cam", value: "#F59E0B" },
  { name: "Đỏ", value: "#EF4444" },
  { name: "Xanh lá", value: "#22C55E" },
  { name: "Xanh dương", value: "#3B82F6" },
  { name: "Tím", value: "#A855F7" },
  { name: "Vàng", value: "#FACC15" },
];

export default function TextOptions({
  value,
  onChange,
  onAdd,
  onRemove,
}: Props) {
  const [customColor, setCustomColor] = useState(value.color);
  const canAddText = value.text.trim().length > 0;

  const update = (patch: Partial<TextOption>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="min-w-0 space-y-3 overflow-x-hidden">
      <section className="min-w-0 space-y-2 rounded-xl border border-border bg-background p-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="text-content" className="text-sm font-semibold">
            Nội dung
          </Label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {value.text.length} ký tự
          </span>
        </div>
        <Textarea
          id="text-content"
          value={value.text}
          onChange={(event) => update({ text: event.target.value })}
          placeholder="Nhập chữ hiển thị trên video..."
          rows={3}
          className="min-h-24 resize-none rounded-xl text-base sm:text-sm"
        />

        {(onAdd || onRemove) && (
          <div
            className={cn(
              "grid min-w-0 gap-2 pt-1",
              onAdd && onRemove ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {onAdd ? (
              <Button
                onClick={onAdd}
                disabled={!canAddText}
                className="h-10 gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Thêm chữ
              </Button>
            ) : null}
            {onRemove ? (
              <Button
                onClick={onRemove}
                variant="outline"
                className="h-10 gap-2"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                Xóa chữ
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <section className="min-w-0 space-y-4 rounded-xl border border-border bg-background p-3">
        <Label className="text-sm font-semibold">Hiển thị</Label>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[1fr_5rem]">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cỡ chữ</Label>
            <Slider
              value={[value.fontSize]}
              onValueChange={([fontSize]) => update({ fontSize })}
              min={8}
              max={96}
              step={1}
            />
          </div>
          <Input
            type="number"
            value={value.fontSize}
            onChange={(event) =>
              update({
                fontSize: Math.min(96, Math.max(8, Number(event.target.value))),
              })
            }
            min={8}
            max={96}
            step={1}
            className="h-10 min-w-0 rounded-xl text-center font-mono"
            aria-label="Cỡ chữ"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Màu chữ</Label>
          <div className="grid min-w-0 grid-cols-4 gap-1.5 sm:grid-cols-8">
            {presetColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  setCustomColor(color.value);
                  update({ color: color.value });
                }}
                className={cn(
                  "h-8 cursor-pointer rounded-full border-2 transition",
                  value.color === color.value
                    ? "border-primary ring-2 ring-primary/25"
                    : "border-border hover:border-primary/50",
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
                aria-label={`Chọn màu ${color.name}`}
              />
            ))}
          </div>
          <div className="flex min-w-0 gap-2">
            <Input
              type="color"
              value={customColor}
              onChange={(event) => {
                setCustomColor(event.target.value);
                update({ color: event.target.value });
              }}
              className="h-10 w-14 cursor-pointer rounded-xl p-1"
              aria-label="Chọn màu chữ"
            />
            <Input
              type="text"
              value={value.color}
              onChange={(event) => update({ color: event.target.value })}
              placeholder="#FFFFFF"
              className="h-10 min-w-0 flex-1 rounded-xl font-mono text-sm"
              aria-label="Mã màu chữ"
            />
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-3 rounded-xl border border-border bg-background p-3">
        <Label className="text-sm font-semibold">Vị trí</Label>
        <PositionSlider
          label="Ngang"
          value={value.position.x}
          onChange={(x) => update({ position: { ...value.position, x } })}
        />
        <PositionSlider
          label="Dọc"
          value={value.position.y}
          onChange={(y) => update({ position: { ...value.position, y } })}
        />
      </section>

      <section className="min-w-0 space-y-3 rounded-xl border border-border bg-background p-3">
        <Label className="text-sm font-semibold">Thời gian</Label>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <TimeInput
            label="Bắt đầu"
            value={value.startTime ?? 0}
            onChange={(startTime) => update({ startTime })}
          />
          <TimeInput
            label="Thời lượng"
            value={value.duration ?? 0}
            onChange={(duration) => update({ duration })}
            placeholder="0 = hết video"
          />
        </div>
      </section>
    </div>
  );
}

function PositionSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {value}%
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        min={0}
        max={100}
        step={1}
      />
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label} (ms)</Label>
      <Input
        type="number"
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
        min={0}
        step={100}
        placeholder={placeholder}
        className="h-10 rounded-xl font-mono text-sm"
      />
    </div>
  );
}
