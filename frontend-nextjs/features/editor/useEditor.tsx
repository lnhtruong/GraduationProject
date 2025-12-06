"use client";

import { useState, useCallback } from "react";
import {
  editorService,
  type EditorOperation,
  type EditorProject,
} from "@/services/editor.service";

export interface EditorState {
  currentProject: EditorProject | null;
  operations: EditorOperation[];
  isProcessing: boolean;
  processingProgress: number;
  error: string | null;
}

export const useEditor = () => {
  const [state, setState] = useState<EditorState>({
    currentProject: null,
    operations: [],
    isProcessing: false,
    processingProgress: 0,
    error: null,
  });

  const loadProject = useCallback(async (projectId: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      const project = await editorService.loadEditorProject(projectId);
      setState((prev) => ({
        ...prev,
        currentProject: project,
        operations: project.operations,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to load project",
      }));
    }
  }, []);

  const saveProject = useCallback(
    async (
      projectData: Omit<EditorProject, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        const savedProject = await editorService.saveEditorProject(projectData);
        setState((prev) => ({
          ...prev,
          currentProject: savedProject,
        }));
        return savedProject;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to save project",
        }));
        throw error;
      }
    },
    []
  );

  const addOperation = useCallback((operation: EditorOperation) => {
    setState((prev) => ({
      ...prev,
      operations: [...prev.operations, { ...operation, timestamp: Date.now() }],
    }));
  }, []);

  const removeOperation = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      operations: prev.operations.filter((_, i) => i !== index),
    }));
  }, []);

  const applyOperations = useCallback(async () => {
    if (!state.currentProject) {
      throw new Error("No project loaded");
    }

    try {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        processingProgress: 0,
      }));

      const result = await editorService.applyEditorOperations({
        projectId: state.currentProject.id,
        operations: state.operations,
      });

      // Here you could poll for processing status similar to upload
      // For now, just simulate progress
      const progressInterval = setInterval(() => {
        setState((prev) => {
          const newProgress = Math.min(prev.processingProgress + 10, 100);
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return {
              ...prev,
              isProcessing: false,
              processingProgress: 100,
            };
          }
          return { ...prev, processingProgress: newProgress };
        });
      }, 500);

      return result.jobId;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error:
          error instanceof Error ? error.message : "Failed to apply operations",
      }));
      throw error;
    }
  }, [state.currentProject, state.operations]);

  const resetEditor = useCallback(() => {
    setState({
      currentProject: null,
      operations: [],
      isProcessing: false,
      processingProgress: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    actions: {
      loadProject,
      saveProject,
      addOperation,
      removeOperation,
      applyOperations,
      resetEditor,
    },
  };
};
