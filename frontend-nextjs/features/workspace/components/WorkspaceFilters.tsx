import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { WorkspaceSortBy, WorkspaceStatusFilter } from "../types";

interface WorkspaceFiltersProps {
  searchValue: string;
  statusFilter: WorkspaceStatusFilter;
  sortBy: WorkspaceSortBy;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: WorkspaceStatusFilter) => void;
  onSortChange: (value: WorkspaceSortBy) => void;
}

export function WorkspaceFilters({
  searchValue,
  statusFilter,
  sortBy,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: WorkspaceFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-border/70 bg-card/80 p-4 md:grid-cols-12">
      <div className="relative md:col-span-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
          placeholder="Tìm theo tên dự án hoặc ID..."
        />
      </div>

      <div className="md:col-span-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusChange(value as WorkspaceStatusFilter)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
            <SelectItem value="finalized">Finalized</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-3">
        <Select
          value={sortBy}
          onValueChange={(value) => onSortChange(value as WorkspaceSortBy)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc">Mới cập nhật</SelectItem>
            <SelectItem value="updated_asc">Cũ nhất</SelectItem>
            <SelectItem value="name_asc">Tên A-Z</SelectItem>
            <SelectItem value="name_desc">Tên Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
