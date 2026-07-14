"use client";

import { Button } from "@/components/ui/button";
import { Folder } from "@/hooks/use-bookmarks";
import { cn } from "@/lib/utils";
import { User } from "firebase/auth";
import {
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  Edit2Icon,
  FolderIcon,
  FolderPlusIcon,
  LogOutIcon,
  MoonIcon,
  PlusIcon,
  StarIcon,
  SunIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

// Define the tree node structure
interface FolderNode {
  folder: Folder;
  children: FolderNode[];
}

interface SidebarProps {
  user: User;
  folders: Folder[];
  tags: string[];
  activeFilter: {
    type: "all" | "favorite" | "unread" | "read" | "trash" | "folder" | "tag";
    value: string | null;
  };
  onFilterChange: (filter: {
    type: "all" | "favorite" | "unread" | "read" | "trash" | "folder" | "tag";
    value: string | null;
  }) => void;
  onAddFolder: (parentId: string | null) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (id: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onSignOut: () => void;
}

export function Sidebar({
  user,
  folders,
  tags,
  activeFilter,
  onFilterChange,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  isMobileOpen,
  setIsMobileOpen,
  onSignOut,
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync theme with document class
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Build recursive folder tree
  const buildFolderTree = (): FolderNode[] => {
    const map: Record<string, FolderNode> = {};
    const roots: FolderNode[] = [];

    // Initialize map
    folders.forEach((f) => {
      map[f.id] = { folder: f, children: [] };
    });

    // Populate children or root
    folders.forEach((f) => {
      const node = map[f.id];
      if (f.parentId && map[f.parentId]) {
        map[f.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort folders alphabetically
    const sortTree = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => a.folder.name.localeCompare(b.folder.name));
      nodes.forEach((n) => sortTree(n.children));
    };
    sortTree(roots);

    return roots;
  };

  const folderTree = buildFolderTree();

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Recursive rendering of folder tree nodes
  const renderFolderNode = (node: FolderNode, level = 0) => {
    const { folder, children } = node;
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders[folder.id];
    const isActive =
      activeFilter.type === "folder" && activeFilter.value === folder.id;

    return (
      <div key={folder.id} className="flex flex-col">
        <div
          onClick={() => {
            onFilterChange({ type: "folder", value: folder.id });
            setIsMobileOpen(false);
          }}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          className={cn(
            "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer select-none hover:bg-zinc-900/8 hover:text-zinc-900 dark:hover:bg-zinc-100/8 dark:hover:text-zinc-50",
            isActive
              ? "bg-zinc-900/8 dark:bg-zinc-100/8 text-zinc-950 dark:text-zinc-50 font-semibold"
              : "text-zinc-600 dark:text-zinc-400",
          )}
        >
          <div className="flex flex-1 items-center min-w-0 gap-2">
            <span
              onClick={(e) => toggleExpand(folder.id, e)}
              className="flex size-5 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDownIcon className="size-3.5" />
                ) : (
                  <ChevronRightIcon className="size-3.5" />
                )
              ) : (
                <span className="size-1 rounded-full bg-zinc-400/50 dark:bg-zinc-600" />
              )}
            </span>
            <FolderIcon className="size-4 shrink-0" />
            <span className="truncate">{folder.name}</span>
          </div>

          {/* Quick inline folder operations */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddFolder(folder.id);
              }}
              title="Add Subfolder"
              className="flex size-5 items-center justify-center rounded-md hover:bg-black/15 hover:text-zinc-900 dark:hover:bg-white/15 dark:hover:text-zinc-50"
            >
              <PlusIcon className="size-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditFolder(folder);
              }}
              title="Rename Folder"
              className="flex size-5 items-center justify-center rounded-md hover:bg-black/15 hover:text-zinc-900 dark:hover:bg-white/15 dark:hover:text-zinc-50"
            >
              <Edit2Icon className="size-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
              title="Delete Folder"
              className="flex size-5 items-center justify-center rounded-md text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20"
            >
              <Trash2Icon className="size-3" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {children.map((child) => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col gap-6 bg-zinc-50 p-4 border-r border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md">
            <BookmarkIcon className="size-4.5" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bookmark Manager
          </span>
        </div>

        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <XIcon />
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-col gap-1">
        <span className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Feeds
        </span>
        {[
          { type: "all", label: "All Bookmarks", icon: BookmarkIcon },
          { type: "favorite", label: "Favorites", icon: StarIcon },
          { type: "unread", label: "Read Later", icon: ClockIcon },
          { type: "read", label: "Read", icon: CheckIcon },
          { type: "trash", label: "Trash", icon: Trash2Icon },
        ].map((item) => {
          const isActive = activeFilter.type === item.type;
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => {
                onFilterChange({ type: item.type as any, value: null });
                setIsMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer select-none",
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                  : "text-zinc-600 hover:bg-zinc-900/8 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/8 dark:hover:text-zinc-50",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Folders Section */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto min-h-0 pr-1">
        <div className="flex items-center justify-between px-3 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Folders
          </span>
          <button
            onClick={() => onAddFolder(null)}
            title="Create Folder"
            className="flex size-5 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <FolderPlusIcon className="size-3.5" />
          </button>
        </div>

        {folders.length === 0 ? (
          <p className="px-3 py-2 text-xs italic text-zinc-400 dark:text-zinc-500">
            No folders created yet.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {folderTree.map((node) => renderFolderNode(node))}
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
        <span className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
          Tags
        </span>
        {tags.length === 0 ? (
          <p className="px-3 py-2 text-xs italic text-zinc-400 dark:text-zinc-500">
            No tags found.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 px-3">
            {tags.map((tag) => {
              const isActive =
                activeFilter.type === "tag" && activeFilter.value === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    onFilterChange({ type: "tag", value: tag });
                    setIsMobileOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100"
                      : "text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800/80",
                  )}
                >
                  <TagIcon className="size-2.5 shrink-0" />
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Profile & Actions */}
      <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-2">
          {/* User Details */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {user.displayName
                ? user.displayName.charAt(0).toUpperCase()
                : user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-50">
                {user.displayName || "User"}
              </span>
              <span className="text-xs truncate text-zinc-400 dark:text-zinc-500">
                {user.email}
              </span>
            </div>
          </div>

          {/* Theme Toggler */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full justify-center gap-2 text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-950/20"
          onClick={onSignOut}
        >
          <LogOutIcon data-icon="inline-start" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen fixed left-0 top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer Sheet */}
          <div className="relative z-50 w-72 h-full flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
