"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useWorkspace } from "./hooks/useWorkspace";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { WorkspaceFilters } from "./components/WorkspaceFilters";
import { ProjectGrid } from "./components/ProjectGrid";
import type { WorkspaceSortBy, WorkspaceStatusFilter } from "./types";

const WORKSPACE_PAGE_SIZE = 12;

export default function Workspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const searchValue = searchParams.get("search") ?? "";
  const statusFilter = toWorkspaceStatusFilter(searchParams.get("status"));
  const sortBy = toWorkspaceSortBy(searchParams.get("sort"));
  const [projectPendingDelete, setProjectPendingDelete] = useState<number | null>(null);
  const {
    projects,
    pagination,
    isProjectLoading,
    isLoadingThumbnails,
    deletingProjectId,
    renamingProjectId,
    error,
    refetchProjects,
    removeProject,
    renameProject,
  } = useWorkspace({
    page,
    limit: WORKSPACE_PAGE_SIZE,
    searchValue,
    statusFilter,
    sortBy,
  });

  useEffect(() => {
    if (pagination.totalPages <= 0 || page <= pagination.totalPages) return;
    replaceWorkspaceParams({
      pathname,
      router,
      searchParams,
      search: searchValue,
      status: statusFilter,
      sort: sortBy,
      page: pagination.totalPages,
    });
  }, [
    page,
    pagination.totalPages,
    pathname,
    router,
    searchParams,
    searchValue,
    sortBy,
    statusFilter,
  ]);

  const handleCreateProject = () => {
    router.push("/editor");
  };

  const handleOpenProject = (projectId: number) => {
    const params = new URLSearchParams();
    params.set("edit_id", String(projectId));
    router.push(`/editor?${params.toString()}`);
  };

  const projectToDelete =
    projectPendingDelete !== null
      ? projects.find((item) => item.project.edit_id === projectPendingDelete)
      : null;

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    await removeProject(projectToDelete.project);
    setProjectPendingDelete(null);
  };

  const handleRenameProject = async (projectId: number, sessionName: string) => {
    const target = projects.find((item) => item.project.edit_id === projectId);
    if (!target) {
      return false;
    }

    return renameProject(target.project, sessionName);
  };

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceHeader
        onCreateProject={() => {
          handleCreateProject();
        }}
      />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 lg:px-8">
        <div className="z-10 shrink-0 space-y-3 bg-background pb-1">
          <WorkspaceFilters
            searchValue={searchValue}
            statusFilter={statusFilter}
            sortBy={sortBy}
            onSearchChange={(value) =>
              replaceWorkspaceParams({
                pathname,
                router,
                searchParams,
                search: value,
                status: statusFilter,
                sort: sortBy,
                page: 1,
              })
            }
            onStatusChange={(value) =>
              replaceWorkspaceParams({
                pathname,
                router,
                searchParams,
                search: searchValue,
                status: value,
                sort: sortBy,
                page: 1,
              })
            }
            onSortChange={(value) =>
              replaceWorkspaceParams({
                pathname,
                router,
                searchParams,
                search: searchValue,
                status: statusFilter,
                sort: value,
                page: 1,
              })
            }
          />
        </div>

        <Card className="rounded-lg border-border/70 p-3 shadow-sm">
          <ProjectGrid
            items={projects}
            isLoading={isProjectLoading}
            isLoadingThumbnails={isLoadingThumbnails}
            deletingProjectId={deletingProjectId}
            renamingProjectId={renamingProjectId}
            error={error}
            onRetry={() => {
              void refetchProjects();
            }}
            onOpenProject={handleOpenProject}
            onDeleteProject={setProjectPendingDelete}
            onRenameProject={handleRenameProject}
          />
          <WorkspacePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            limit={pagination.limit}
            hrefForPage={(nextPage) =>
              getWorkspacePageHref(pathname, searchParams, {
                search: searchValue,
                status: statusFilter,
                sort: sortBy,
                page: nextPage,
              })
            }
            onPageChange={(nextPage) =>
              replaceWorkspaceParams({
                pathname,
                router,
                searchParams,
                search: searchValue,
                status: statusFilter,
                sort: sortBy,
                page: nextPage,
              })
            }
          />
        </Card>
      </section>

      <AlertDialog
        open={projectPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProjectPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa dự án?</AlertDialogTitle>
            <AlertDialogDescription>
              Dự án{" "}
              <span className="font-medium text-foreground">
                {projectToDelete?.project.session_name}
              </span>{" "}
              sẽ bị xóa khỏi workspace. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDeleteProject();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toWorkspaceStatusFilter(value: string | null): WorkspaceStatusFilter {
  return value === "draft" || value === "saved" || value === "finalized" ? value : "all";
}

function toWorkspaceSortBy(value: string | null): WorkspaceSortBy {
  if (
    value === "updated_asc" ||
    value === "name_asc" ||
    value === "name_desc" ||
    value === "updated_desc"
  ) {
    return value;
  }
  return "updated_desc";
}

function getWorkspacePageHref(
  pathname: string,
  searchParams: ReadonlyURLSearchParamsLike,
  params: {
    search: string;
    status: WorkspaceStatusFilter;
    sort: WorkspaceSortBy;
    page: number;
  },
) {
  const nextParams = buildWorkspaceParams(searchParams, params);
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function replaceWorkspaceParams({
  pathname,
  router,
  searchParams,
  search,
  status,
  sort,
  page,
}: {
  pathname: string;
  router: { replace: (href: string, options?: { scroll?: boolean }) => void };
  searchParams: ReadonlyURLSearchParamsLike;
  search: string;
  status: WorkspaceStatusFilter;
  sort: WorkspaceSortBy;
  page: number;
}) {
  const nextParams = buildWorkspaceParams(searchParams, { search, status, sort, page });
  const query = nextParams.toString();
  router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
}

function buildWorkspaceParams(
  searchParams: ReadonlyURLSearchParamsLike,
  {
    search,
    status,
    sort,
    page,
  }: {
    search: string;
    status: WorkspaceStatusFilter;
    sort: WorkspaceSortBy;
    page: number;
  },
) {
  const nextParams = new URLSearchParams(searchParams.toString());
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    nextParams.set("search", trimmedSearch);
  } else {
    nextParams.delete("search");
  }
  if (status === "all") {
    nextParams.delete("status");
  } else {
    nextParams.set("status", status);
  }
  if (sort === "updated_desc") {
    nextParams.delete("sort");
  } else {
    nextParams.set("sort", sort);
  }
  if (page > 1) {
    nextParams.set("page", String(page));
  } else {
    nextParams.delete("page");
  }
  return nextParams;
}

function WorkspacePagination({
  page,
  totalPages,
  totalItems,
  limit,
  hrefForPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hrefForPage: (page: number) => string;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = getVisiblePages(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = Math.min(totalItems, page * limit);
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="mt-3 flex flex-col items-center gap-2 border-t border-border/70 pt-3 sm:flex-row sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Hiển thị {pageStart}-{pageEnd} / {totalItems}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={hrefForPage(prevPage)}
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (page > 1) onPageChange(prevPage);
              }}
            />
          </PaginationItem>
          {pageNumbers.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href={hrefForPage(pageNumber)}
                isActive={pageNumber === page}
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(pageNumber);
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href={hrefForPage(nextPage)}
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (page < totalPages) onPageChange(nextPage);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function getVisiblePages(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

type ReadonlyURLSearchParamsLike = {
  toString: () => string;
};
