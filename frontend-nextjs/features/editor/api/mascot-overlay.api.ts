import { createResourceApi } from "@/features/_shared/crud-factories";
import type {
  MascotOverlay,
  MascotOverlayRequest,
  UpdateMascotOverlayRequest,
} from "../types";

const MASCOT_OVERLAY_ENDPOINT = "/media/mascot_overlays";

const mascotOverlayResourceApi = createResourceApi<
  MascotOverlay,
  MascotOverlay,
  MascotOverlayRequest,
  UpdateMascotOverlayRequest,
  number,
  number,
  { message: string }
>({
  basePath: MASCOT_OVERLAY_ENDPOINT,
  mapItem: (raw: MascotOverlay) => raw,
  getListPath: (editId?: number) =>
    `${MASCOT_OVERLAY_ENDPOINT}/edit/${editId ?? ""}`,
  getOnePath: (id) => `${MASCOT_OVERLAY_ENDPOINT}/${id}`,
  getUpdatePath: (id) => `${MASCOT_OVERLAY_ENDPOINT}/${id}`,
  getDeletePath: (id) => `${MASCOT_OVERLAY_ENDPOINT}/${id}`,
});

const listByParent = (editId: number) => mascotOverlayResourceApi.list!(editId);

export const mascotOverlayApi = {
  ...mascotOverlayResourceApi,
  listByParent,
};
