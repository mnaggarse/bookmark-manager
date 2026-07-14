"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Bookmark, Folder } from "@/hooks/use-bookmarks";
import { BookmarkCard } from "./BookmarkCard";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, InboxIcon, SearchIcon, Trash2Icon, RefreshCwIcon } from "lucide-react";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  folders: Folder[];
  viewMode: "grid" | "list";
  activeFilterType: "all" | "favorite" | "unread" | "trash" | "folder" | "tag";
  searchQuery: string;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string, permanently: boolean) => void;
  onRestore?: (id: string) => void;
  onToggleFavorite: (id: string, isPinned: boolean) => void;
  onToggleArchived: (id: string, isArchived: boolean) => void;
  onClearSearch?: () => void;
  onAddBookmarkClick?: () => void;
  onEmptyTrash?: () => void;
}

export function BookmarkList({
  bookmarks,
  folders,
  viewMode,
  activeFilterType,
  searchQuery,
  onEdit,
  onDelete,
  onRestore,
  onToggleFavorite,
  onToggleArchived,
  onClearSearch,
  onAddBookmarkClick,
  onEmptyTrash,
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    // Determine the empty state messages
    let title = "No bookmarks found";
    let desc = "Start collecting links and organizing them.";
    let mediaIcon = <InboxIcon className="size-6" />;
    let actionElement: React.ReactNode = null;

    if (searchQuery) {
      title = "No search results";
      desc = `We couldn't find anything matching "${searchQuery}".`;
      mediaIcon = <SearchIcon className="size-6" />;
      if (onClearSearch) {
        actionElement = (
          <Button onClick={onClearSearch} variant="outline" size="sm">
            Clear Search
          </Button>
        );
      }
    } else if (activeFilterType === "trash") {
      title = "Trash is empty";
      desc = "Bookmarks you delete will show up here.";
      mediaIcon = <Trash2Icon className="size-6" />;
    } else if (activeFilterType === "favorite") {
      title = "No favorites yet";
      desc = "Pin important bookmarks to find them here easily.";
      mediaIcon = <BookmarkIcon className="size-6" />;
    } else if (activeFilterType === "unread") {
      title = "All caught up!";
      desc = "No unread bookmarks in your list.";
      mediaIcon = <InboxIcon className="size-6" />;
    } else {
      if (onAddBookmarkClick) {
        actionElement = (
          <Button onClick={onAddBookmarkClick} size="sm">
            Add your first bookmark
          </Button>
        );
      }
    }

    return (
      <div className="flex h-[50vh] flex-col items-center justify-center">
        <Empty className="max-w-md border-0 bg-transparent py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">{mediaIcon}</EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{desc}</EmptyDescription>
          </EmptyHeader>
          {actionElement && <EmptyContent>{actionElement}</EmptyContent>}
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Show an Empty Trash action if we are in Trash and have items */}
      {activeFilterType === "trash" && bookmarks.length > 0 && onEmptyTrash && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 p-3 rounded-xl">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-red-800 dark:text-red-300">
              Trash bin contains {bookmarks.length} {bookmarks.length === 1 ? "item" : "items"}.
            </span>
            <span className="text-[11px] text-red-600 dark:text-red-400">
              Items will remain here until permanently deleted or emptied.
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onEmptyTrash}
            className="h-8 text-xs gap-1.5"
          >
            <Trash2Icon className="size-3.5 shrink-0" />
            Empty Trash
          </Button>
        </div>
      )}

      {/* Bookmarks Grid / List */}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
            : "flex flex-col gap-2.5"
        )}
      >
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            folders={folders}
            viewMode={viewMode}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestore={onRestore}
            onToggleFavorite={onToggleFavorite}
            onToggleArchived={onToggleArchived}
          />
        ))}
      </div>
    </div>
  );
}
