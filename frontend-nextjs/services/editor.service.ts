/**
 * Editor Service Layer
 * Handles all video editing-related API communications
 * Future service for editor features
 */

import { httpClient } from "@/lib/client/http";

// Types for editor operations
export interface EditorOperation {
  type: "cut" | "trim" | "merge" | "filter";
  params: Record<string, unknown>;
  timestamp?: number;
}

export interface EditorProject {
  id: string;
  name: string;
  videoUrl: string;
  operations: EditorOperation[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingRequest {
  projectId: string;
  operations: EditorOperation[];
}

/**
 * Apply editor operations to video
 * @param request - Processing request with operations
 * @returns Promise<{ jobId: string }> - Processing job ID
 */
export async function applyEditorOperations(
  request: ProcessingRequest
): Promise<{ jobId: string }> {
  try {
    const result = await httpClient.post<Record<string, unknown>>(
      "/editor/process",
      request
    );
    return {
      jobId: (result.jobId as string) || (result.job_id as string),
    };
  } catch (error) {
    throw new Error(`Editor service error: ${error}`);
  }
}

/**
 * Save editor project
 * @param project - Editor project data
 * @returns Promise<EditorProject> - Saved project
 */
export async function saveEditorProject(
  project: Omit<EditorProject, "id" | "createdAt" | "updatedAt">
): Promise<EditorProject> {
  try {
    const result = await httpClient.post<EditorProject>(
      "/editor/projects",
      project
    );
    return result;
  } catch (error) {
    throw new Error(`Save project error: ${error}`);
  }
}

/**
 * Load editor project
 * @param projectId - Project ID
 * @returns Promise<EditorProject> - Project data
 */
export async function loadEditorProject(
  projectId: string
): Promise<EditorProject> {
  try {
    const result = await httpClient.get<EditorProject>(
      `/editor/projects/${projectId}`
    );
    return result;
  } catch (error) {
    throw new Error(`Load project error: ${error}`);
  }
}

/**
 * Get user's editor projects
 * @returns Promise<EditorProject[]> - List of projects
 */
export async function getUserProjects(): Promise<EditorProject[]> {
  try {
    const result = await httpClient.get<EditorProject[]>("/editor/projects");
    return result;
  } catch (error) {
    throw new Error(`Get projects error: ${error}`);
  }
}

// Export service object
export const editorService = {
  applyEditorOperations,
  saveEditorProject,
  loadEditorProject,
  getUserProjects,
};
