/**
 * Project API
 * CRUD endpoints for editing sessions/projects
 */

import { createResourceApi } from "@/features/_shared/crud-factories";
import type { Video } from "@/features/video";
import type {
  CreateProjectRequest,
  DeleteProjectResponse,
  Project,
  UpdateProjectRequest,
} from "../types";

const PROJECT_ENDPOINT = "/media/projects";

type ProjectApiResponse = {
  edit_id?: number;
  user_id?: number;
  video_id?: number | null;
  session_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  video?: VideoApiResponse | null;
};

type VideoApiResponse = {
  id?: number;
  user_id?: number;
  image_id?: number | null;
  type?: string;
  url?: string;
  thumbnail?: string | null;
  duration?: number | null;
  created_at?: string;
  updated_at?: string;
};

function mapVideo(raw?: VideoApiResponse | null): Video | null {
  if (!raw) return null;

  return {
    id: raw.id ?? 0,
    user_id: raw.user_id,
    image_id: raw.image_id ?? null,
    url: raw.url ?? "",
    duration: raw.duration ?? null,
    type: (raw.type ?? "highlight") as Video["type"],
    thumbnail: raw.thumbnail ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function mapProject(raw: ProjectApiResponse): Project {
  return {
    edit_id: raw.edit_id ?? 0,
    user_id: raw.user_id ?? 0,
    video_id: raw.video_id ?? null,
    video: mapVideo(raw.video),
    session_name: raw.session_name ?? "Dự án chưa đặt tên",
    status: (raw.status ?? "draft") as Project["status"],
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

const projectCrudApi = createResourceApi<
  ProjectApiResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  number,
  unknown,
  DeleteProjectResponse
>({
  basePath: PROJECT_ENDPOINT,
  mapItem: mapProject,
  getListPath: () => `${PROJECT_ENDPOINT}/user`,
});

export const projectApi = {
  ...projectCrudApi,
  findById: projectCrudApi.getOne,
  getAllByUser: () => projectCrudApi.list?.() ?? Promise.resolve([]),
  updateById: projectCrudApi.update,
  deleteById: projectCrudApi.delete,
};
