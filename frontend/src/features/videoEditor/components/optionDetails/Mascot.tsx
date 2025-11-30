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
          onClick={() => onChange({ type: 'none', position: 'replace' })}
          className={`p-3 rounded-lg border-2 cursor-pointer mb-2 ${
            value.type === 'none'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <p className="text-sm font-medium">Không dùng Mascot</p>
          <p className="text-xs text-muted-foreground">Giữ nguyên video gốc</p>
        </div>

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
                  onClick={() => onChange({ type: 'preset', presetId: mascot.id, position: 'replace' })}
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
                    : 'Tải lên file hình ảnh (.png, .jpg, .jpeg)'}
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
                  onChange({ type: 'custom', customFile: file, position: 'replace' });
                }
              }}
            />
          </label>
        </div>
      </div>
      
      {/* Position selection when mascot is selected */}
      {value.type !== 'none' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Vị trí Mascot
          </label>
          
          {/* Replace video option */}
          <div
            onClick={() => onChange({ ...value, position: 'replace' })}
            className={`p-3 rounded-lg border-2 cursor-pointer mb-2 ${
              value.position === 'replace'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="text-sm font-medium">Thay thế video</p>
            <p className="text-xs text-muted-foreground">Mascot sẽ thay thế toàn bộ video gốc</p>
          </div>

          {/* Corner positions */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'top-left', label: 'Góc trên trái' },
              { value: 'top-right', label: 'Góc trên phải' },
              { value: 'bottom-left', label: 'Góc dưới trái' },
              { value: 'bottom-right', label: 'Góc dưới phải' },
            ].map((pos) => (
              <div
                key={pos.value}
                onClick={() => onChange({ ...value, position: pos.value as any })}
                className={`p-3 rounded-lg border-2 cursor-pointer ${
                  value.position === pos.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium text-center">{pos.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply button */}
      {value.type !== 'none' && value.position && (
        <button
          onClick={async () => {
            try {
              // TODO: Call API to apply mascot
              const formData = new FormData();
              if (value.type === 'preset' && value.presetId) {
                formData.append('mascotType', 'preset');
                formData.append('presetId', value.presetId);
              } else if (value.type === 'custom' && value.customFile) {
                formData.append('mascotType', 'custom');
                formData.append('file', value.customFile);
              }
              formData.append('position', value.position);
              
              // const response = await fetch('/api/apply-mascot', {
              //   method: 'POST',
              //   body: formData,
              // });
              // const newVideoUrl = await response.json();
              // Update video URL in parent component
              
              console.log('Applying mascot with position:', value.position);
            } catch (error) {
              console.error('Error applying mascot:', error);
            }
          }}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Áp dụng
        </button>
      )}

      {/* Sau khi chọn 1 mascot bất kỳ */}
      {/* {value.type !== 'none' && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            Mascot sẽ thay thế video gốc. Chỉ giữ lại âm thanh và đồng bộ với chuyển động của mascot.
          </p>
        </div>
      )} */}
    </div>
  );
}