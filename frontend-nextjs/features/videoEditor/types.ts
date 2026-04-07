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
  imageId?: number;
  customFile?: File;
  localFileUrl?: string; // Blob URL for local files (not serialized to localStorage)
  audioFile?: File;
  margin_x: number;
  margin_y: number;
  scale: number;
  sourceWidth?: number;
  sourceHeight?: number;
  previewPlacement?: MascotPreviewPlacement;
}

export interface MascotPreviewPlacement {
  x: number;
  y: number;
  aspectRatio: number;
  hasPlaced: boolean;
}

export interface VideoFrameSize {
  // Base (source-of-truth) video resolution.
  width: number;
  height: number;
  // Rendered preview size in UI.
  displayWidth?: number;
  displayHeight?: number;
  // Scale factors between UI preview and base video resolution.
  scaleX?: number;
  scaleY?: number;
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
  // Timeline & Dimension
  startTime?: number; // ms, default 0
  duration?: number; // ms, default 0 (whole video)
  width?: number; // px or %, default auto
  height?: number; // px or %, default auto
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
  editId?: number | null;
  effect: EffectOption;
  onEffectChange: (effect: EffectOption) => void;
  mascot: MascotOption;
  onMascotChange: (mascot: MascotOption) => void;
  onMascotApply: () => Promise<void> | void;
  onMascotCreateVideo: () => Promise<void> | void;
  existingMascotOverlayId?: number | null;
  isApplyingMascot: boolean;
  isCreatingMascotVideo: boolean;
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
