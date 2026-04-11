import { createCrudHooks } from "@/features/_shared/crud-factories";
import { mascotOverlayApi } from "./mascot-overlay.api";
import type {
  MascotOverlay,
  MascotOverlayRequest,
  UpdateMascotOverlayRequest,
} from "../types";

export const layerCrud = createCrudHooks<
  MascotOverlay,
  MascotOverlayRequest,
  UpdateMascotOverlayRequest,
  number,
  number,
  number,
  { message: string }
>("mascot-layers", mascotOverlayApi, {
  idField: "mascot_overlay_id",
});

export const layerKeys = layerCrud.keys;

export const {
  useListByParent: useProjectLayers,
  useDetail: useLayer,
  useCreate: useCreateLayer,
  useUpdate: useUpdateLayer,
  useDelete: useDeleteLayer,
} = layerCrud;
