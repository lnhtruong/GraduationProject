/**
 * Video Editor Types
 * Consolidated type definitions for UI state and API DTOs
 */

// ============================================================================
// UI STATE & COMPONENT TYPES
// ============================================================================

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
  removeBackground?: boolean;
  bgMode?: "green_screen" | "transparent";
  bgQualityMode?: "fast" | "clean";
  greenScreenColor?: string;
  chromakeySimilarity?: number;
  chromakeyBlend?: number;
  alphaContractPx?: number;
  alphaBlurPx?: number;
  animationMode?: "human" | "animal";
  qualityMode?: "ultrafast" | "fast" | "balanced" | "quality";
  drivingMultiplier?: number;
  flagStitching?: boolean;
  flagPasteback?: boolean;
  flagNormalizeLip?: boolean;
  flagRelativeMotion?: boolean;
  flagDoCrop?: boolean;
  cropScale?: number;
  vxRatio?: number;
  vyRatio?: number;
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

export interface MascotRenderTextOverlay {
  text: string;
  x: string | number;
  y: string | number;
  fontsize: number;
  fontcolor: string;
  start?: number;
  end?: number;
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
  currentTimeMs?: number;
  videoDurationMs?: number;
}


// ============================================================================
// API DTOs & REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateProjectRequest {
  session_name: string;
  video_id?: number;
}

export interface UpdateProjectRequest {
  session_name?: string;
  status?: "draft" | "saved" | "finalized";
  video_id?: number;
}

export interface Project {
  edit_id: number;
  user_id: number;
  video_id?: number;
  session_name: string;
  status: "draft" | "saved" | "finalized";
  created_at: string;
  updated_at: string;
}

export interface UserVideo {
  id?: number;
  video_id?: number;
  image_id?: number;
  user_id: number;
  name?: string | null;
  type?: "highlight" | "mascot" | string;
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MascotImage {
  image_id: number;
  user_id: number;
  url: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MascotOverlayRequest {
  edit_id?: number;
  image_id?: number;
  position_x: number;
  position_y: number;
  scale: number;
  start_time: number;
  end_time: number;
  layer_index: number;
}

export interface UpdateMascotOverlayRequest {
  image_id?: number;
  position_x?: number;
  position_y?: number;
  scale?: number;
  start_time?: number;
  end_time?: number;
  layer_index?: number;
}

export interface MascotOverlay {
  mascot_overlay_id: number;
  edit_id: number;
  image_id?: number | null;
  position_x: number;
  position_y: number;
  scale: number;
  start_time: number;
  end_time: number;
  layer_index: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  mascotImage?: {
    image_id: number;
    user_id: number;
    url: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export type { CloudinarySignature } from "@/features/cloudinary";

export interface MascotParams {
  videoOrUrl: File | string;
  mascotImageUrl: string;
  origin_file_name?: string;
  /** Thời lượng video, giây. Dùng để backend tính credit quota. */
  durationSec?: number;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "replace";
  margin_x?: number;
  margin_y?: number;
  scale?: number;
  audio?: File;
  textOverlays?: MascotRenderTextOverlay[];
  brightness?: number;
  contrast?: number;
  saturation?: number;
  gamma?: number;
  removeBackground?: boolean;
  bgMode?: string;
  bgQualityMode?: string;
  greenScreenColor?: string;
  chromakeySimilarity?: number;
  chromakeyBlend?: number;
  alphaContractPx?: number;
  alphaBlurPx?: number;
  animationMode?: string;
  qualityMode?: string;
  cfgScale?: number;
  drivingMultiplier?: number;
  flagStitching?: boolean;
  flagPasteback?: boolean;
  flagNormalizeLip?: boolean;
  flagRelativeMotion?: boolean;
  flagDoCrop?: boolean;
  cropScale?: number;
  vxRatio?: number;
  vyRatio?: number;
}

export interface CreateMascotVideoPayload {
  url: string;
  image_id?: number;
  duration?: number;
}
