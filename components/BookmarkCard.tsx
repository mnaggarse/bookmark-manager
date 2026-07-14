"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bookmark, Folder } from "@/hooks/use-bookmarks";
import { cn } from "@/lib/utils";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  Edit2Icon,
  ExternalLinkIcon,
  FolderIcon,
  RotateCcwIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

interface BookmarkCardProps {
  bookmark: Bookmark;
  folders: Folder[];
  viewMode: "grid" | "list";
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string, permanently: boolean) => void;
  onRestore?: (id: string) => void;
  onToggleFavorite: (id: string, isPinned: boolean) => void;
  onToggleArchived: (id: string, isArchived: boolean) => void;
}

export function BookmarkCard({
  bookmark,
  folders,
  viewMode,
  onEdit,
  onDelete,
  onRestore,
  onToggleFavorite,
  onToggleArchived,
}: BookmarkCardProps) {
  const folder = folders.find((f) => f.id === bookmark.folderId);

  // Extract simple hostname/domain
  let domain = "";
  try {
    domain = new URL(bookmark.url).hostname.replace(/^www\./i, "");
  } catch (e) {
    domain = bookmark.url;
  }

  // Consistent colorful gradient based on domain hashing
  const getDomainGradient = (domainName: string): string => {
    let hash = 0;
    for (let i = 0; i < domainName.length; i++) {
      hash = domainName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      "from-rose-400 to-pink-500 dark:from-rose-950/40 dark:to-pink-900/40",
      "from-orange-400 to-amber-500 dark:from-orange-950/40 dark:to-amber-900/40",
      "from-emerald-400 to-teal-500 dark:from-emerald-950/40 dark:to-teal-900/40",
      "from-blue-400 to-cyan-500 dark:from-blue-950/40 dark:to-cyan-900/40",
      "from-violet-400 to-purple-500 dark:from-violet-950/40 dark:to-purple-900/40",
      "from-fuchsia-400 to-violet-500 dark:from-fuchsia-950/40 dark:to-violet-900/40",
    ];
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const gradientClass = getDomainGradient(domain);
  const firstLetter = domain.charAt(0).toUpperCase();

  // Actions Bar
  const actions = (
    <div className="flex items-center gap-1">
      {bookmark.isTrash ? (
        <>
          {onRestore && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRestore(bookmark.id)}
              title="Restore"
              className="text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(bookmark.id, true)}
            title="Delete Permanently"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </>
      ) : (
        <>
          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggleFavorite(bookmark.id, !bookmark.isPinned)}
            title={bookmark.isPinned ? "Unpin Bookmark" : "Pin Bookmark"}
            className={cn(
              bookmark.isPinned
                ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                : "text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50",
            )}
          >
            <StarIcon
              className={cn("size-4", bookmark.isPinned && "fill-current")}
            />
          </Button>

          {/* Mark read/unread toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggleArchived(bookmark.id, !bookmark.isArchived)}
            title={
              bookmark.isArchived ? "Mark as Unread" : "Mark as Read / Archive"
            }
            className={cn(
              bookmark.isArchived
                ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                : "text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50",
            )}
          >
            {bookmark.isArchived ? (
              <CheckCircle2Icon
                className="size-4 fill-current text-white dark:text-zinc-900"
                style={{ color: "var(--color-emerald-500)" }}
              />
            ) : (
              <ClockIcon className="size-4" />
            )}
          </Button>

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(bookmark)}
            title="Edit"
            className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            <Edit2Icon className="size-4" />
          </Button>

          {/* Trash Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(bookmark.id, false)}
            title="Move to Trash"
            className="text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </>
      )}
    </div>
  );

  if (viewMode === "list") {
    return (
      <div className="group flex flex-row items-center gap-4 border border-zinc-200/80 bg-white p-3 rounded-xl transition-all shadow-xs hover:shadow-md hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
        {/* Preview / Logo (List Mode) */}
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
          {bookmark.imageUrl ? (
            <img
              src={bookmark.imageUrl}
              alt={bookmark.title}
              className="size-full object-cover"
              onError={(e) => {
                // If image fails to load, fallback to text representation
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className={cn(
                "flex size-full items-center justify-center bg-gradient-to-br font-semibold text-white",
                gradientClass,
              )}
            >
              {firstLetter}
            </div>
          )}
        </div>

        {/* Content Section (List Mode) */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-50">
              {bookmark.title}
            </h3>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              title="Open Link"
            >
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </div>

          <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="truncate max-w-[120px] sm:max-w-none">
              {domain}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 shrink-0">
              <BookOpenIcon className="size-3" />
              {bookmark.readTimeEstimate} min
            </span>
            {folder && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 shrink-0">
                  <FolderIcon className="size-3" />
                  {folder.name}
                </span>
              </>
            )}
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 flex-wrap">
                {bookmark.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-1.5 py-0.5 text-[10px] font-normal leading-none"
                  >
                    {tag}
                  </Badge>
                ))}
                {bookmark.tags.length > 3 && (
                  <span className="text-[10px]">
                    +{bookmark.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="shrink-0">{actions}</div>
      </div>
    );
  }

  // Card Grid Layout (viewMode === "grid")
  return (
    <div className="group flex flex-col overflow-hidden border border-zinc-200/80 bg-white rounded-2xl transition-all shadow-xs hover:shadow-lg hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
      {/* Card Image Banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {bookmark.imageUrl ? (
          <img
            src={bookmark.imageUrl}
            alt={bookmark.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : null}

        {/* Gradient fallback overlay when image fails/is null */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-gradient-to-br text-3xl font-extrabold text-white transition-transform duration-300 group-hover:scale-105",
            gradientClass,
            bookmark.imageUrl && "hidden",
          )}
        >
          {firstLetter}
        </div>

        {/* Badge Overlays */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pointer-events-none">
          {bookmark.isPinned && (
            <Badge className="bg-amber-500 text-white font-medium shadow-xs border-0">
              Pinned
            </Badge>
          )}
          {bookmark.isArchived && (
            <Badge className="bg-emerald-600 text-white font-medium shadow-xs border-0">
              Read
            </Badge>
          )}
        </div>

        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
          <BookOpenIcon className="size-3" />
          <span>{bookmark.readTimeEstimate} min read</span>
        </div>
      </div>

      {/* Card Content body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold text-zinc-900 dark:text-zinc-50 min-h-10 leading-snug">
            {bookmark.title}
          </h3>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0"
          >
            <ExternalLinkIcon className="size-4" />
          </a>
        </div>

        {bookmark.description && (
          <p className="line-clamp-2 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 flex-1 leading-relaxed">
            {bookmark.description}
          </p>
        )}

        {/* Tag list */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {bookmark.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-normal"
              >
                {tag}
              </Badge>
            ))}
            {bookmark.tags.length > 4 && (
              <span className="text-[10px] text-zinc-400 leading-4">
                +{bookmark.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <Separator className="my-3.5" />

        {/* Metadata Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 min-w-0">
            {folder ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 truncate">
                <FolderIcon className="size-3.5 shrink-0 text-zinc-400" />
                <span className="truncate">{folder.name}</span>
              </span>
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                {domain}
              </span>
            )}
          </div>

          {/* Action Row */}
          <div>{actions}</div>
        </div>
      </div>
    </div>
  );
}
