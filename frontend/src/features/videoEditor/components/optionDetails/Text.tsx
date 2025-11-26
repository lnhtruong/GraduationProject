import { useState } from 'react';
import type { TextOption } from '@/features/videoEditor/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  value: TextOption;
  onChange: (value: TextOption) => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

const fontFamilies = [
  { id: 'Arial', name: 'Arial' },
  { id: 'Times New Roman', name: 'Times New Roman' },
  { id: 'Courier New', name: 'Courier New' },
  { id: 'Georgia', name: 'Georgia' },
  { id: 'Verdana', name: 'Verdana' },
  { id: 'Comic Sans MS', name: 'Comic Sans MS' },
];

const presetColors = [
  { name: 'Trắng', value: '#FFFFFF' },
  { name: 'Đen', value: '#000000' },
  { name: 'Đỏ', value: '#FF0000' },
  { name: 'Xanh lá', value: '#00FF00' },
  { name: 'Xanh dương', value: '#0000FF' },
  { name: 'Vàng', value: '#FFFF00' },
  { name: 'Hồng', value: '#FF00FF' },
  { name: 'Cyan', value: '#00FFFF' },
];

export default function TextOptions({ value, onChange, onAdd, onRemove }: Props) {
  const [customColor, setCustomColor] = useState(value.color);

  return (
    <div className="space-y-5">
      {/* Text Content */}
      <div className="space-y-2">
        <Label htmlFor="text-content" className="text-sm font-semibold">
          Nội dung văn bản
        </Label>
        <Textarea
          id="text-content"
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Nhập văn bản của bạn..."
          rows={3}
          className="resize-none overflow-y-auto break-words"
        />
      </div>

      {/* Position */}
      <Card className="p-4">
        <Label className="text-sm font-semibold">Vị trí</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Ngang (X)</Label>
            <Badge variant="secondary" className="text-xs font-mono">
              {value.position.x}%
            </Badge>
          </div>
          <Slider
            value={[value.position.x]}
            onValueChange={([x]) =>
              onChange({ ...value, position: { ...value.position, x } })
            }
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Dọc (Y)</Label>
            <Badge variant="secondary" className="text-xs font-mono">
              {value.position.y}%
            </Badge>
          </div>
          <Slider
            value={[value.position.y]}
            onValueChange={([y]) =>
              onChange({ ...value, position: { ...value.position, y } })
            }
            min={0}
            max={100}
            step={1}
          />
        </div>
      </Card>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Kích thước chữ</Label>
          <Badge variant="secondary" className="text-xs font-mono">
            {value.fontSize}px
          </Badge>
        </div>
        <Slider
          value={[value.fontSize]}
          onValueChange={([fontSize]) => onChange({ ...value, fontSize })}
          min={12}
          max={96}
          step={2}
        />
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <Label htmlFor="font-family" className="text-sm font-semibold">
          Phông chữ
        </Label>
        <Select
          value={value.fontFamily}
          onValueChange={(fontFamily) => onChange({ ...value, fontFamily })}
        >
          <SelectTrigger id="font-family">
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

      {/* Font Style & Text Align */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Định dạng văn bản</Label>
        <div className="grid grid-cols-2 gap-3">
          {/* Font Styles */}
          <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Kiểu chữ</Label>
        <div className="flex gap-1">
          <Button
        variant={value.fontWeight === 'bold' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange({ 
          ...value, 
          fontWeight: value.fontWeight === 'bold' ? 'normal' : 'bold' 
        })}
        className="flex-1 font-bold"
          >
        B
          </Button>
          <Button
        variant="outline"
        size="sm"
        className="flex-1 italic"
          >
        I
          </Button>
          <Button
        variant="outline"
        size="sm"
        className="flex-1 underline"
          >
        U
          </Button>
        </div>
          </div>

          {/* Text Align */}
          <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Căn chỉnh</Label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
        <Button
          key={align}
          variant={value.textAlign === align ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange({ ...value, textAlign: align })}
          className="flex-1"
        >
          {align === 'left' ? '⫷' : align === 'center' ? '☰' : '⫸'}
        </Button>
          ))}
        </div>
          </div>
        </div>


        {/* Color */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Màu chữ</Label>
          <div className="grid grid-cols-10 gap-1.5">
            {presetColors.map((color) => (
              <button
                key={color.value}
                onClick={() => onChange({ ...value, color: color.value })}
                className={`h-6 rounded border-2 transition-all ${
                  value.color === color.value
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
              
          <div className="flex gap-2">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                onChange({ ...value, color: e.target.value });
              }}
              className="w-12 h-8 cursor-pointer"
            />
            <Input
              type="text"
              value={value.color}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              placeholder="#FFFFFF"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {(onAdd || onRemove) && (
        <div className="flex gap-2 pt-4 border-t">
          {onAdd && (
            <Button onClick={onAdd} className="flex-1" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Thêm văn bản mới
            </Button>
          )}
          {onRemove && (
            <Button onClick={onRemove} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-1" />
              Xóa
            </Button>
          )}
        </div>
      )}
    </div>
  );
}