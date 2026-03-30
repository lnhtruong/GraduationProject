export type OptionType = "mascot" | "voice" | "text" | "effect";

export interface MascotOption {
  type: "preset" | "none" | "custom";
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "replace";
  presetId?: string;
  presetUrl?: string;
  customFile?: File;
  audioFile?: File;
  margin_x: number;
  margin_y: number;
  scale: number;
  previewPlacement?: MascotPreviewPlacement;
}

export interface MascotPreviewPlacement {
  xPct: number;
  yPct: number;
  aspectRatio: number;
  hasPlaced: boolean;
}

export interface VideoFrameSize {
  width: number;
  height: number;
}

export interface VoiceOption {
  type: "preset" | "none" | "custom";
  presetId?: string;
  customFile?: File;
  speed: number; // 0.5 - 2.0
  volume: number; // 0 - 100
  pitch: number; // -12 to +12
}

export interface TextOption {
  id: string;
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  textAlign: "left" | "center" | "right";
}

export interface EffectOption {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  filter?:
    | "none"
    | "vintage"
    | "cinematic"
    | "vivid"
    | "grayscale"
    | "sepia"
    | "warm"
    | "cool";
}

// Helper type for text overlays array operations
export interface TextOverlayActions {
  add: (text: TextOption) => void;
  update: (id: string, updates: Partial<TextOption>) => void;
  remove: (id: string) => void;
}

export type LayerType = "text" | "mascot";

export interface BaseLayer {
  id: string;
  type: LayerType;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  data: TextOption;
}

export interface MascotLayer extends BaseLayer {
  type: "mascot";
  data: MascotOption;
}

//use layerItem contain TextLayer and MascotLayer (for now)
export type LayerItem = TextLayer | MascotLayer;

export interface ExternalEditorPanelBindings {
  effect: EffectOption;
  onEffectChange: (effect: EffectOption) => void;
  mascot: MascotOption;
  onMascotChange: (mascot: MascotOption) => void;
  onMascotApply: () => void;
  isApplyingMascot: boolean;
  mascotProgress?: string;
  videoFile: File | null;
  videoSourceUrl?: string;
  mascotFrameSize: VideoFrameSize | null;
  voice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  layers: LayerItem[];
  onTextAdd: (text: TextOption) => void;
  onTextUpdate: (id: string, updates: Partial<TextOption> | TextOption) => void;
  onTextRemove: (id: string) => void;
  selectedTextId: string | null;
  onTextSelect: (id: string | null) => void;
}
