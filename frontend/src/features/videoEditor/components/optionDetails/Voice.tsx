import { Upload } from 'lucide-react';
import type { VoiceOption } from '@/features/videoEditor/types';

interface Props {
  value: VoiceOption;
  onChange: (value: VoiceOption) => void;
}

// Voice có sẵn
const presetVoices = [
  { id: 'male-1', name: 'Nam - Tự nhiên', gender: 'male' },
  { id: 'male-2', name: 'Nam - Sôi động', gender: 'male' },
  { id: 'female-1', name: 'Nữ - Tự nhiên', gender: 'female' },
  { id: 'female-2', name: 'Nữ - Ngọt ngào', gender: 'female' },
];

export default function VoiceOptions({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Chọn Giọng nói
        </label>

        {/* Option: Không đổi giọng */}
        <div
          onClick={() =>
            onChange({ type: 'none', speed: 1, volume: 100, pitch: 0 })
          }
          className={`p-3 rounded-lg border-2 cursor-pointer mb-2 ${
            value.type === 'none'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <p className="text-sm font-medium">Không đổi giọng nói</p>
          <p className="text-xs text-muted-foreground">Giữ nguyên âm thanh gốc</p>
        </div>

        {/* Preset Voices */}
        <div className="mb-2">
          <details className="group">
            <summary className="p-3 rounded-lg border-2 cursor-pointer border-border hover:border-primary/50 list-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Giọng nói có sẵn</p>
                  {value.type === 'preset' && (
                    <p className="text-xs text-muted-foreground">
                      {presetVoices.find(v => v.id === value.presetId)?.name}
                    </p>
                  )}
                </div>
                <svg
                  className="w-4 h-4 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div className="space-y-2 mt-2 pl-2">
              {presetVoices.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() =>
                    onChange({
                      type: 'preset',
                      presetId: voice.id,
                      speed: value.speed,
                      volume: value.volume,
                      pitch: value.pitch,
                    })
                  }
                  className={`p-3 rounded-lg border-2 cursor-pointer ${
                    value.type === 'preset' && value.presetId === voice.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="text-sm font-medium">{voice.name}</p>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Custom Voice */}
        <div
          className={`p-3 rounded-lg border-2 border-dashed cursor-pointer ${
            value.type === 'custom'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <label className="cursor-pointer block">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <div className="flex-1">
                <p className="text-sm font-medium">Giọng nói tự tạo</p>
                <p className="text-xs text-muted-foreground">
                  {value.type === 'custom' && value.customFile
                    ? value.customFile.name
                    : 'Tải lên file âm thanh (.mp3, .wav)'}
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange({
                    type: 'custom',
                    customFile: file,
                    speed: value.speed,
                    volume: value.volume,
                    pitch: value.pitch,
                  });
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Voice Controls */}
      {value.type !== 'none' && (
        <div className="space-y-4 pt-4 border-t">
          <div>
            <label className="block text-xs text-secondary-foreground mb-1">
              Tốc độ: {value.speed.toFixed(1)}x
            </label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={value.speed}
              onChange={(e) =>
                onChange({ ...value, speed: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-secondary-foreground mb-1">
              Âm lượng: {value.volume}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={value.volume}
              onChange={(e) =>
                onChange({ ...value, volume: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-secondary-foreground mb-1">
              Cao độ: {value.pitch > 0 ? '+' : ''}
              {value.pitch}
            </label>
            <input
              type="range"
              min={-12}
              max={12}
              value={value.pitch}
              onChange={(e) =>
                onChange({ ...value, pitch: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}