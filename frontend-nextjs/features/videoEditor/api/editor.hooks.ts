/**
 * Video Editor Hooks
 */

import { mascotApi, highlightApi } from "./editor.api";
import type {
  MascotParams,
  MascotResult,
  HighlightParams,
  HighlightResult,
} from "./editor.api";
import { createHooks } from "@/features/_shared/hooks";
import type { JobStatusResponse } from "@/features/_shared/types";

// ============================================================================
// BASE HOOKS
// ============================================================================

const baseMascotHooks = createHooks<
  MascotParams,
  JobStatusResponse,
  MascotResult
>("mascot", mascotApi);

const baseHighlightHooks = createHooks<
  HighlightParams,
  JobStatusResponse,
  HighlightResult
>("highlight", highlightApi);

// ============================================================================
// EXPORTS
// ============================================================================

export const { useJobStatus: useMascotJobStatus, useStartJob: useAddMascot } =
  baseMascotHooks;

export const {
  useJobStatus: useHighlightJobStatus,
  useStartJob: useCreateHighlight,
} = baseHighlightHooks;

// Re-export validation utilities
export {
  calculateMaxMargins,
  validateMascotParams,
  getDefaultMascotParams,
} from "./editor.api";
