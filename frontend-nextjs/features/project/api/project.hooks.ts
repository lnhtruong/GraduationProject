/**
 * Project Hooks
 * TanStack Query hooks for project CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-factories";
import { useQuery } from "@tanstack/react-query";
import { projectApi } from "./project.api";
import type { ProjectListParams } from "./project.api";
import type {
  CreateProjectRequest,
  Project,
  UpdateProjectRequest,
} from "../types";

export const projectHooks = createCrudHooks<
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  number
>("project", projectApi, {
  idField: "edit_id",
});

export const projectKeys = projectHooks.keys;

export const {
  useDetail: useProjectById,
  useList: useProjectsByUser,
  useCreate: useCreateProject,
  useUpdate: useUpdateProject,
  useDelete: useDeleteProject,
} = projectHooks;

export function useProjectsByUserPaginated(params: ProjectListParams, enabled = true) {
  return useQuery({
    queryKey: projectKeys.custom("workspace-page", params),
    queryFn: () => projectApi.getAllByUserPaginated(params),
    enabled,
    staleTime: 2 * 60_000,
  });
}
