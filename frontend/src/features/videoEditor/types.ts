export type OptionType = 'mascot' | 'voice' | 'text' | 'effect';

export interface MascotOption {
  type: 'preset' | 'none' | 'custom';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'replace';
  presetId?: string;
  customFile?: File;
}

export interface VoiceOption {
  type: 'preset' | 'none' | 'custom';
  presetId?: string;
  customFile?: File;
  speed: number;  // 0.5 - 2.0
  volume: number; // 0 - 100
  pitch: number;  // -12 to +12
}

export interface TextOption {
  id: string;
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
}

export interface EffectOption {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  filter?: 'none' | 'vintage' | 'cinematic' | 'vivid' | 'grayscale' | 'sepia' | 'warm' | 'cool';
}

// Helper type for text overlays array operations
export interface TextOverlayActions {
  add: (text: TextOption) => void;
  update: (id: string, updates: Partial<TextOption>) => void;
  remove: (id: string) => void;
}