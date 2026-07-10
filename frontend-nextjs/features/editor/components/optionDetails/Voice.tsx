import { Check, Mic2, Upload } from "lucide-react";
import type { VoiceOption } from "@/features/editor/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface Props {
  value: VoiceOption;
  onChange: (value: VoiceOption) => void;
}

const presetVoices = [
  { id: "male-1", name: "Nam tự nhiên", description: "Rõ, đều nhịp" },
  { id: "male-2", name: "Nam năng lượng", description: "Nhanh, nổi bật" },
  { id: "female-1", name: "Nữ tự nhiên", description: "Mềm, dễ nghe" },
  { id: "female-2", name: "Nữ truyền cảm", description: "Ấm và rõ chữ" },
];

export default function VoiceOptions({ value, onChange }: Props) {
  const selectNone = () => {
    onChange({ type: "none", speed: 1, volume: 100, pitch: 0 });
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <div>
          <Label className="text-sm font-semibold">Giọng nói</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Giữ âm thanh gốc hoặc chọn giọng đọc cho video.
          </p>
        </div>

        <button
          type="button"
          onClick={selectNone}
          className={cn(
            "w-full rounded-xl border bg-background p-3 text-left transition hover:border-primary/60",
            value.type === "none" && "border-primary bg-primary/10",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Giữ âm thanh gốc</p>
              <p className="text-xs text-muted-foreground">
                Không thay đổi giọng nói trong video.
              </p>
            </div>
            {value.type === "none" ? <Check className="h-4 w-4 text-primary" /> : null}
          </div>
        </button>

        <div className="grid grid-cols-2 gap-2">
          {presetVoices.map((voice) => {
            const selected = value.type === "preset" && value.presetId === voice.id;
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() =>
                  onChange({
                    type: "preset",
                    presetId: voice.id,
                    speed: value.speed,
                    volume: value.volume,
                    pitch: value.pitch,
                  })
                }
                className={cn(
                  "rounded-xl border bg-background p-3 text-left transition hover:border-primary/60",
                  selected && "border-primary bg-primary/10 ring-2 ring-primary/20",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Mic2 className="h-4 w-4 text-primary" />
                  {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                </div>
                <p className="text-sm font-medium">{voice.name}</p>
                <p className="text-xs text-muted-foreground">
                  {voice.description}
                </p>
              </button>
            );
          })}
        </div>

        <label
          className={cn(
            "block cursor-pointer rounded-xl border border-dashed bg-background p-3 transition hover:border-primary/60",
            value.type === "custom" && "border-primary bg-primary/10",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Tải file âm thanh</p>
              <p className="truncate text-xs text-muted-foreground">
                {value.type === "custom" && value.customFile
                  ? value.customFile.name
                  : "MP3, WAV hoặc file audio khác"}
              </p>
            </div>
          </div>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onChange({
                type: "custom",
                customFile: file,
                speed: value.speed,
                volume: value.volume,
                pitch: value.pitch,
              });
            }}
          />
        </label>
      </section>

      {value.type !== "none" ? (
        <section className="space-y-4 rounded-xl border border-border bg-background/70 p-3">
          <Label className="text-sm font-semibold">Tinh chỉnh</Label>
          <VoiceSlider
            label="Tốc độ"
            value={value.speed}
            min={0.5}
            max={2}
            step={0.1}
            formatter={(next) => `${next.toFixed(1)}x`}
            onChange={(speed) => onChange({ ...value, speed })}
          />
          <VoiceSlider
            label="Âm lượng"
            value={value.volume}
            min={0}
            max={100}
            step={1}
            formatter={(next) => `${next}%`}
            onChange={(volume) => onChange({ ...value, volume })}
          />
          <VoiceSlider
            label="Cao độ"
            value={value.pitch}
            min={-12}
            max={12}
            step={1}
            formatter={(next) => `${next > 0 ? "+" : ""}${next}`}
            onChange={(pitch) => onChange({ ...value, pitch })}
          />
        </section>
      ) : null}
    </div>
  );
}

function VoiceSlider({
  label,
  value,
  min,
  max,
  step,
  formatter,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatter: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Badge variant="secondary" className="font-mono text-xs">
          {formatter(value)}
        </Badge>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}
