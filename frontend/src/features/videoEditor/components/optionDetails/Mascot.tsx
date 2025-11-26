import { Upload } from 'lucide-react';
import type { MascotOption } from '@/features/videoEditor/types';

interface Props {
  value: MascotOption;
  onChange: (value: MascotOption) => void;
}

// Mascot có sẵn
const presetMascots = [
  { id: 'cat', name: 'Mèo', thumbnail: '/mascots/cat.jpg' },
  { id: 'dog', name: 'Chó', thumbnail: '/mascots/dog.jpg' },
  { id: 'bear', name: 'Gấu', thumbnail: '/mascots/bear.jpg' },
  { id: 'rabbit', name: 'Thỏ', thumbnail: '/mascots/rabbit.jpg' },
];

export default function MascotOptions({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Chọn Mascot
        </label>
        
        {/* Option: Không dùng mascot */}
        <div
          onClick={() => onChange({ type: 'none' })}
          className={`p-3 rounded-lg border-2 cursor-pointer mb-2 ${
            value.type === 'none'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <p className="text-sm font-medium">Không dùng Mascot</p>
          <p className="text-xs text-muted-foreground">Giữ nguyên video gốc</p>
        </div>

        {/* CẦN CHỈNH CHO CHỌN MASCOT THÌ CALL API */}
        {/* Preset Mascots */}
        <div className="mb-2">
          <details className="group">
            <summary className="p-3 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer list-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mascot có sẵn</p>
                  <p className="text-xs text-muted-foreground">
                    {value.type === 'preset' 
                      ? presetMascots.find(m => m.id === value.presetId)?.name 
                      : 'Chọn mascot từ thư viện'}
                  </p>
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

            <div className="grid grid-cols-2 gap-2 mt-2 px-1">
              {presetMascots.map((mascot) => (
                <div
                  key={mascot.id}
                  onClick={() => onChange({ type: 'preset', presetId: mascot.id })}
                  className={`p-2 rounded-lg border-2 cursor-pointer ${
                    value.type === 'preset' && value.presetId === mascot.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-square bg-muted rounded mb-1 flex items-center justify-center">
                    <span className="text-2xl">{mascot.name[0]}</span>
                  </div>
                  <p className="text-xs text-center font-medium">{mascot.name}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
        
        {/* Custom Mascot */}
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
                <p className="text-sm font-medium">Mascot tự tạo</p>
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
                  onChange({ type: 'custom', customFile: file });
                }
              }}
            />
          </label>
        </div>
        {/* ========================================== */}
      </div>
      
      {/* Sau khi chọn 1 mascot bất kỳ */}
      {value.type !== 'none' && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            Mascot sẽ thay thế video gốc. Chỉ giữ lại âm thanh và đồng bộ với chuyển động của mascot.
          </p>
        </div>
      )}
    </div>
  );
}