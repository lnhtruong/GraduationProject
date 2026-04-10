/**
 * Project Hooks
 * TanStack Query hooks for project CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-factories";
import { projectApi } from "./project.api";
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
