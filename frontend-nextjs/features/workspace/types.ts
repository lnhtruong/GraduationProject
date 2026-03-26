import type { Project, ProjectStatus } from "@/features/project";
import type { Video } from "@/features/video";

export type WorkspaceStatusFilter = "all" | ProjectStatus;

export type WorkspaceSortBy =
  | "updated_desc"
  | "updated_asc"
  | "name_asc"
  | "name_desc";

export interface WorkspaceProjectItem {
  project: Project;
  video: Video | null;
  thumbnail: string | null;
}
