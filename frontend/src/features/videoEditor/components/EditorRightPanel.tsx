interface Props {
  brightness: number;
  contrast: number;
  saturation: number;
  onChange: (next: {
    brightness: number;
    contrast: number;
    saturation: number;
  }) => void;
}

export default function EditorRightPanel({
  brightness,
  contrast,
  saturation,
  onChange,
}: Props) {
  return (
    <div className="col-span-3 bg-secondary rounded-md p-4 shadow-sm">
      <h3 className="text-sm font-medium mb-3">Style / Effects</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-secondary-foreground mb-1">
            Brightness
          </label>
          <input
            type="range"
            min={0}
            max={200}
            value={brightness}
            onChange={(e) =>
              onChange({
                brightness: Number(e.target.value),
                contrast,
                saturation,
              })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-secondary-foreground mb-1">
            Contrast
          </label>
          <input
            type="range"
            min={0}
            max={200}
            value={contrast}
            onChange={(e) =>
              onChange({
                brightness,
                contrast: Number(e.target.value),
                saturation,
              })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-secondary-foreground mb-1">
            Saturation
          </label>
          <input
            type="range"
            min={0}
            max={200}
            value={saturation}
            onChange={(e) =>
              onChange({
                brightness,
                contrast,
                saturation: Number(e.target.value),
              })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-secondary-foreground mb-1">
            Filters
          </label>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-primary rounded text-sm"
              onClick={() =>
                onChange({ brightness, contrast, saturation: 120 })
              }
            >
              Vintage
            </button>
            <button
              className="px-3 py-1 bg-primary rounded text-sm"
              onClick={() =>
                onChange({ brightness: 90, contrast: 120, saturation })
              }
            >
              Cinematic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
