import { Check, Upload } from "lucide-react";
import type { VoiceOption } from "@/features/editor/types";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  value: VoiceOption;
  onChange: (value: VoiceOption) => void;
}

export default function VoiceOptions({ value, onChange }: Props) {
  const selectNone = () => {
    onChange({ type: "none", speed: 1, volume: 100, pitch: 0 });
  };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <section className="min-w-0 space-y-3">
        <div>
          <Label className="text-sm font-semibold">Âm thanh mascot</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Chọn nguồn âm thanh dùng để tạo chuyển động cho mascot.
          </p>
        </div>

        <button
          type="button"
          onClick={selectNone}
          className={cn(
            "w-full min-w-0 rounded-xl border bg-background p-3 text-left transition hover:border-primary/60",
            value.type === "none" && "border-primary bg-primary/10",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Dùng âm thanh gốc</p>
              <p className="text-xs text-muted-foreground">
                Lấy âm thanh từ video hiện tại.
              </p>
            </div>
            {value.type === "none" ? (
              <Check className="h-4 w-4 text-primary" />
            ) : null}
          </div>
        </button>

        <label
          className={cn(
            "block min-w-0 cursor-pointer rounded-xl border border-dashed bg-background p-3 transition hover:border-primary/60",
            value.type === "custom" && "border-primary bg-primary/10",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Tải file audio</p>
              <p className="truncate text-xs text-muted-foreground">
                {value.type === "custom" && value.customFile
                  ? value.customFile.name
                  : "MP3, WAV hoặc file audio khác"}
              </p>
            </div>
            {value.type === "custom" ? (
              <Check className="h-4 w-4 text-primary" />
            ) : null}
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
                speed: 1,
                volume: 100,
                pitch: 0,
              });
            }}
          />
        </label>
      </section>
    </div>
  );
}
