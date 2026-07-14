"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark, Folder, useBookmarks } from "@/hooks/use-bookmarks";
import { User } from "firebase/auth";
import {
  BookmarkIcon,
  ClockIcon,
  FolderOpenIcon,
  GridIcon,
  ListIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TagIcon,
  Trash2Icon,
  CheckCircle2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BookmarkDialog } from "./BookmarkDialog";
import { BookmarkList } from "./BookmarkList";
import { ConfirmDialog } from "./ConfirmDialog";
import { FolderDialog } from "./FolderDialog";
import { Sidebar } from "./Sidebar";
import { logout } from "@/lib/firebase";

interface DashboardProps {
  user: User;
}

type FilterType = {
  type: "all" | "favorite" | "unread" | "read" | "trash" | "folder" | "tag";
  value: string | null;
};

export function Dashboard({ user }: DashboardProps) {
  const {
    bookmarks,
    folders,
    allTags,
    isLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    restoreBookmark,
    emptyTrash,
    addFolder,
    updateFolder,
    deleteFolder,
  } = useBookmarks(user.uid);

  // Filter & UI state
  const [activeFilter, setActiveFilter] = useState<FilterType>({
    type: "all",
    value: null,
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isBookmarkOpen, setIsBookmarkOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>(
    undefined,
  );

  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | undefined>(
    undefined,
  );
  const [parentFolderForNewNode, setParentFolderForNewNode] = useState<
    string | null
  >(null);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Confirm Dialog configuration state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const handleDeleteFolderClick = (id: string) => {
    const folder = folders.find((f) => f.id === id);
    const folderName = folder ? folder.name : "this folder";
    setConfirmConfig({
      isOpen: true,
      title: "Delete Folder?",
      description: `Are you sure you want to delete "${folderName}"? All subfolders will be moved to the root, and bookmarks inside will be moved to no folder. This action cannot be undone.`,
      actionLabel: "Delete Folder",
      isDestructive: true,
      onConfirm: async () => {
        await deleteFolder(id);
      },
    });
  };

  const handleDeleteBookmarkClick = (id: string, permanently: boolean) => {
    if (permanently) {
      const bookmark = bookmarks.find((b) => b.id === id);
      const bookmarkTitle = bookmark ? bookmark.title : "this bookmark";
      setConfirmConfig({
        isOpen: true,
        title: "Delete Bookmark?",
        description: `Are you sure you want to permanently delete "${bookmarkTitle}"? This action cannot be undone.`,
        actionLabel: "Delete Permanently",
        isDestructive: true,
        onConfirm: async () => {
          await deleteBookmark(id, true);
        },
      });
    } else {
      deleteBookmark(id, false);
    }
  };

  const handleEmptyTrashClick = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Empty Trash?",
      description: "Are you sure you want to permanently delete all bookmarks in the Trash? This action cannot be undone.",
      actionLabel: "Empty Trash",
      isDestructive: true,
      onConfirm: async () => {
        await emptyTrash();
      },
    });
  };

  const handleSignOutClick = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Sign Out?",
      description: "Are you sure you want to sign out of your account?",
      actionLabel: "Sign Out",
      isDestructive: false,
      onConfirm: async () => {
        await logout();
      },
    });
  };

  // Sync viewMode from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("viewMode") as
      | "grid"
      | "list"
      | null;
    if (savedView) {
      setViewMode(savedView);
    }
  }, []);

  const toggleViewMode = () => {
    const nextMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(nextMode);
    localStorage.setItem("viewMode", nextMode);
  };

  // Folder Operations handlers
  const handleAddFolderClick = (parentId: string | null) => {
    setEditingFolder(undefined);
    setParentFolderForNewNode(parentId);
    setIsFolderOpen(true);
  };

  const handleEditFolderClick = (folder: Folder) => {
    setEditingFolder(folder);
    setParentFolderForNewNode(null);
    setIsFolderOpen(true);
  };

  const handleSaveFolder = async (name: string, parentId: string | null) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, name, parentId);
    } else {
      await addFolder(name, parentId);
    }
  };

  // Bookmark Operations handlers
  const handleAddBookmarkClick = () => {
    setEditingBookmark(undefined);
    setIsBookmarkOpen(true);
  };

  const handleEditBookmarkClick = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsBookmarkOpen(true);
  };

  const handleSaveBookmark = async (bookmarkData: any) => {
    if (editingBookmark) {
      await updateBookmark(editingBookmark.id, bookmarkData);
    } else {
      await addBookmark(bookmarkData);
    }
  };

  const handleToggleFavorite = async (id: string, isPinned: boolean) => {
    await updateBookmark(id, { isPinned });
  };

  const handleToggleArchived = async (id: string, isArchived: boolean) => {
    await updateBookmark(id, { isArchived });
  };

  // Filter & Search logic
  const filteredBookmarks = bookmarks.filter((b) => {
    // 1. Trash filter
    if (activeFilter.type === "trash") {
      if (!b.isTrash) return false;
    } else {
      if (b.isTrash) return false;
    }

    // 2. Feed filter
    if (activeFilter.type === "favorite" && !b.isPinned) return false;
    if (activeFilter.type === "unread" && b.isArchived) return false;
    if (activeFilter.type === "read" && !b.isArchived) return false;
    if (activeFilter.type === "folder" && b.folderId !== activeFilter.value)
      return false;
    if (
      activeFilter.type === "tag" &&
      (!b.tags || !b.tags.includes(activeFilter.value || ""))
    )
      return false;

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchDesc = b.description?.toLowerCase().includes(q);
      const matchUrl = b.url.toLowerCase().includes(q);
      const matchTags = b.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchUrl || matchTags;
    }

    return true;
  });

  // Sorting logic
  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return a.createdAt - b.createdAt;
      case "alpha-asc":
        return a.title.localeCompare(b.title);
      case "alpha-desc":
        return b.title.localeCompare(a.title);
      case "read-desc":
        return b.readTimeEstimate - a.readTimeEstimate;
      case "read-asc":
        return a.readTimeEstimate - b.readTimeEstimate;
      case "date-desc":
      default:
        return b.createdAt - a.createdAt;
    }
  });

  // Compute feed section details for header title display
  const getFilterHeaderDetails = () => {
    if (searchQuery) {
      return {
        title: "Search Results",
        description: `Showing matches for "${searchQuery}"`,
        icon: <SearchIcon className="size-5 text-zinc-400" />,
      };
    }

    switch (activeFilter.type) {
      case "favorite":
        return {
          title: "Favorites",
          description: "Your pinned and starred bookmarks",
          icon: <StarIcon className="size-5 text-amber-500 fill-amber-500" />,
        };
      case "unread":
        return {
          title: "Read Later",
          description: "Bookmarks waiting to be read",
          icon: <ClockIcon className="size-5 text-violet-500" />,
        };
      case "read":
        return {
          title: "Read",
          description: "Bookmarks you have finished reading",
          icon: <CheckCircle2Icon className="size-5 text-emerald-500" />,
        };
      case "trash":
        return {
          title: "Trash",
          description: "Temporary storage for deleted bookmarks",
          icon: <Trash2Icon className="size-5 text-red-500" />,
        };
      case "folder":
        const currentFolder = folders.find((f) => f.id === activeFilter.value);
        return {
          title: currentFolder ? currentFolder.name : "Folder",
          description: "Bookmarks stored in this folder",
          icon: <FolderOpenIcon className="size-5 text-blue-500" />,
        };
      case "tag":
        return {
          title: `#${activeFilter.value}`,
          description: `Bookmarks tagged with ${activeFilter.value}`,
          icon: <TagIcon className="size-5 text-emerald-500" />,
        };
      case "all":
      default:
        return {
          title: "All Bookmarks",
          description: "Your entire collected library of links",
          icon: (
            <BookmarkIcon className="size-5 text-zinc-800 dark:text-zinc-300" />
          ),
        };
    }
  };

  const headerDetails = getFilterHeaderDetails();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        folders={folders}
        tags={allTags}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onAddFolder={handleAddFolderClick}
        onEditFolder={handleEditFolderClick}
        onDeleteFolder={handleDeleteFolderClick}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onSignOut={handleSignOutClick}
      />

      {/* Main Panel Content */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-64">
        {/* Sticky Dashboard Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/80 px-6 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <div className="flex flex-1 items-center gap-4">
            {/* Mobile Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden shrink-0"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <MenuIcon />
            </Button>

            {/* Search Input bar */}
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search bookmarks by title, tags, or URL..."
                className="pl-9 pr-4 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus-visible:bg-zinc-950"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Action and Layout Controllers */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val || "date-desc")}
            >
              <SelectTrigger className="w-[150px] rounded-xl border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <SelectValue placeholder="Sort bookmarks">
                  {sortBy === "date-desc" && "Newest Added"}
                  {sortBy === "date-asc" && "Oldest Added"}
                  {sortBy === "alpha-asc" && "Title (A-Z)"}
                  {sortBy === "alpha-desc" && "Title (Z-A)"}
                  {sortBy === "read-asc" && "Shortest Read"}
                  {sortBy === "read-desc" && "Longest Read"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="date-desc">Newest Added</SelectItem>
                  <SelectItem value="date-asc">Oldest Added</SelectItem>
                  <SelectItem value="alpha-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="alpha-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="read-asc">Shortest Read</SelectItem>
                  <SelectItem value="read-desc">Longest Read</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Grid / List Layout toggler */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleViewMode}
              title={
                viewMode === "grid"
                  ? "Switch to List View"
                  : "Switch to Grid View"
              }
              className="rounded-xl border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hidden sm:inline-flex"
            >
              {viewMode === "grid" ? <ListIcon /> : <GridIcon />}
            </Button>

            {/* Primary Action Button */}
            <Button
              onClick={handleAddBookmarkClick}
              className="rounded-xl bg-zinc-900 text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold gap-1.5"
            >
              <PlusIcon data-icon="inline-start" />
              Add Link
            </Button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
          {/* Feed Title Banner */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xs shrink-0">
              {headerDetails.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                {headerDetails.title}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {headerDetails.description}
              </p>
            </div>
          </div>

          {/* Bookmark list rendering */}
          {isLoading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-3 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Loading library...
                </span>
              </div>
            </div>
          ) : (
            <BookmarkList
              bookmarks={sortedBookmarks}
              folders={folders}
              viewMode={viewMode}
              activeFilterType={activeFilter.type}
              searchQuery={searchQuery}
              onEdit={handleEditBookmarkClick}
              onDelete={handleDeleteBookmarkClick}
              onRestore={restoreBookmark}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchived={handleToggleArchived}
              onClearSearch={() => setSearchQuery("")}
              onAddBookmarkClick={handleAddBookmarkClick}
              onEmptyTrash={handleEmptyTrashClick}
            />
          )}
        </main>
      </div>

      {/* Dialog Modals */}
      <FolderDialog
        isOpen={isFolderOpen}
        onOpenChange={setIsFolderOpen}
        onSave={handleSaveFolder}
        folder={editingFolder}
        existingFolders={folders}
      />

      <BookmarkDialog
        isOpen={isBookmarkOpen}
        onOpenChange={setIsBookmarkOpen}
        onSave={handleSaveBookmark}
        bookmark={editingBookmark}
        folders={folders}
      />

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onOpenChange={(open) =>
          setConfirmConfig((prev) => ({ ...prev, isOpen: open }))
        }
        title={confirmConfig.title}
        description={confirmConfig.description}
        actionLabel={confirmConfig.actionLabel}
        cancelLabel={confirmConfig.cancelLabel}
        onConfirm={confirmConfig.onConfirm}
        isDestructive={confirmConfig.isDestructive}
      />
    </div>
  );
}
