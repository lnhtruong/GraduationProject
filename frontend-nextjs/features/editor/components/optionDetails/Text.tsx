"use client";

import { useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Plus, Trash2 } from "lucide-react";
import type { TextOption } from "@/features/editor/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  value: TextOption;
  onChange: (value: TextOption) => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

const fontFamilies = [
  { id: "Inter", name: "Inter" },
  { id: "Arial", name: "Arial" },
  { id: "Georgia", name: "Georgia" },
  { id: "Verdana", name: "Verdana" },
  { id: "Times New Roman", name: "Times New Roman" },
  { id: "Courier New", name: "Courier New" },
];

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

const alignmentOptions = [
  { value: "left", label: "Trái", icon: AlignLeft },
  { value: "center", label: "Giữa", icon: AlignCenter },
  { value: "right", label: "Phải", icon: AlignRight },
] as const;

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
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="text-content" className="text-sm font-semibold">
            Nội dung
          </Label>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {value.text.length} ký tự
          </Badge>
        </div>
        <Textarea
          id="text-content"
          value={value.text}
          onChange={(event) => update({ text: event.target.value })}
          placeholder="Nhập chữ hiển thị trên video..."
          rows={3}
          className="min-h-24 resize-none rounded-xl text-base sm:text-sm"
        />
      </section>

      {(onAdd || onRemove) && (
        <div className="grid grid-cols-2 gap-2">
          {onAdd ? (
            <Button
              onClick={onAdd}
              disabled={!canAddText}
              className="h-11 gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Thêm chữ
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              onClick={onRemove}
              variant="destructive"
              className="h-11 gap-2"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
              Xóa
            </Button>
          ) : null}
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-border bg-background/70 p-3">
        <Label className="text-sm font-semibold">Kiểu chữ</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cỡ chữ</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => update({ fontSize: Math.max(12, value.fontSize - 2) })}
                className="h-10 w-10"
              >
                -
              </Button>
              <Input
                type="number"
                value={value.fontSize}
                onChange={(event) =>
                  update({
                    fontSize: Math.min(
                      96,
                      Math.max(12, Number(event.target.value)),
                    ),
                  })
                }
                min={12}
                max={96}
                step={2}
                className="h-10 text-center font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => update({ fontSize: Math.min(96, value.fontSize + 2) })}
                className="h-10 w-10"
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family" className="text-xs text-muted-foreground">
              Phông chữ
            </Label>
            <Select
              value={value.fontFamily}
              onValueChange={(fontFamily) => update({ fontFamily })}
            >
              <SelectTrigger id="font-family" className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    <span style={{ fontFamily: font.id }}>{font.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Định dạng</Label>
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant={value.fontWeight === "bold" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  update({
                    fontWeight:
                      value.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className="h-10 font-bold"
              >
                B
              </Button>
              <Button
                variant={value.fontStyle === "italic" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  update({
                    fontStyle:
                      value.fontStyle === "italic" ? "normal" : "italic",
                  })
                }
                className="h-10 italic"
              >
                I
              </Button>
              <Button
                variant={
                  value.textDecoration === "underline" ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  update({
                    textDecoration:
                      value.textDecoration === "underline"
                        ? "none"
                        : "underline",
                  })
                }
                className="h-10 underline"
              >
                U
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Căn chữ</Label>
            <div className="grid grid-cols-3 gap-1">
              {alignmentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={
                      value.textAlign === option.value ? "default" : "outline"
                    }
                    size="icon"
                    onClick={() => update({ textAlign: option.value })}
                    className="h-10 w-full"
                    title={option.label}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-background/70 p-3">
        <Label className="text-sm font-semibold">Màu chữ</Label>
        <div className="grid grid-cols-8 gap-1.5">
          {presetColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => update({ color: color.value })}
              className={cn(
                "h-8 rounded-full border-2 transition",
                value.color === color.value
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border hover:border-primary/50",
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="color"
            value={customColor}
            onChange={(event) => {
              setCustomColor(event.target.value);
              update({ color: event.target.value });
            }}
            className="h-10 w-14 cursor-pointer rounded-xl p-1"
          />
          <Input
            type="text"
            value={value.color}
            onChange={(event) => update({ color: event.target.value })}
            placeholder="#FFFFFF"
            className="h-10 flex-1 rounded-xl font-mono text-sm"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-background/70 p-3">
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

      <section className="space-y-3 rounded-xl border border-border bg-background/70 p-3">
        <Label className="text-sm font-semibold">Thời lượng</Label>
        <div className="grid grid-cols-2 gap-3">
          <TimeInput
            label="Bắt đầu"
            value={value.startTime ?? 0}
            onChange={(startTime) => update({ startTime })}
          />
          <TimeInput
            label="Hiển thị"
            value={value.duration ?? 0}
            onChange={(duration) => update({ duration })}
            placeholder="0 = toàn bộ"
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
        <Badge variant="secondary" className="font-mono text-xs">
          {value}%
        </Badge>
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
