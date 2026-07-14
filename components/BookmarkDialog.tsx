"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark, Folder } from "@/hooks/use-bookmarks";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

interface BookmarkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bookmarkData: any) => Promise<void>;
  bookmark?: Bookmark; // If provided, we are editing
  folders: Folder[];
}

export function BookmarkDialog({
  isOpen,
  onOpenChange,
  onSave,
  bookmark,
  folders,
}: BookmarkDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [folderId, setFolderId] = useState("none");
  const [readTime, setReadTime] = useState<number>(1);
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Sync state when dialog opens or bookmark changes
  useEffect(() => {
    if (isOpen) {
      if (bookmark) {
        setUrl(bookmark.url);
        setTitle(bookmark.title);
        setDescription(bookmark.description || "");
        setImageUrl(bookmark.imageUrl || "");
        setTagsInput(bookmark.tags ? bookmark.tags.join(", ") : "");
        setFolderId(bookmark.folderId ? bookmark.folderId : "none");
        setReadTime(bookmark.readTimeEstimate || 1);
        setIsPinned(bookmark.isPinned || false);
      } else {
        setUrl("");
        setTitle("");
        setDescription("");
        setImageUrl("");
        setTagsInput("");
        setFolderId("none");
        setReadTime(1);
        setIsPinned(false);
      }
    }
  }, [isOpen, bookmark]);

  const validateUrl = (str: string) => {
    try {
      const formatted = str.trim();
      const withProto = /^https?:\/\//i.test(formatted)
        ? formatted
        : `https://${formatted}`;
      new URL(withProto);
      return withProto;
    } catch {
      return null;
    }
  };

  const fetchMetadata = async (targetUrl: string) => {
    const validUrl = validateUrl(targetUrl);
    if (!validUrl) return;

    setIsFetchingMetadata(true);
    try {
      const response = await fetch(
        `/api/metadata?url=${encodeURIComponent(validUrl)}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.title && !title) setTitle(data.title);
        if (data.description && !description) setDescription(data.description);
        if (data.imageUrl && !imageUrl) setImageUrl(data.imageUrl);
        if (data.readTimeEstimate) setReadTime(data.readTimeEstimate);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleUrlBlur = () => {
    if (url.trim() && !title) {
      fetchMetadata(url);
    }
  };

  const handleManualFetch = () => {
    if (url.trim()) {
      fetchMetadata(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    setIsSubmitting(true);
    try {
      // Parse tags
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const bookmarkData = {
        url: url.trim(),
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || null,
        tags,
        folderId: folderId === "none" ? null : folderId,
        readTimeEstimate: readTime,
        isPinned,
        isArchived: bookmark ? bookmark.isArchived : false,
        isTrash: bookmark ? bookmark.isTrash : false,
      };

      await onSave(bookmarkData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save bookmark:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {bookmark ? "Edit Bookmark" : "Add Bookmark"}
          </DialogTitle>
          <DialogDescription>
            {bookmark
              ? "Update the details of your bookmark."
              : "Paste a URL and we'll automatically fetch its details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <Field>
              <Label htmlFor="bookmark-url">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="bookmark-url"
                  placeholder="example.com or https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  required
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleManualFetch}
                  disabled={isFetchingMetadata || !url.trim() || isSubmitting}
                  className="shrink-0"
                >
                  {isFetchingMetadata ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <>
                      <SparklesIcon data-icon="inline-start" />
                      Auto-fill
                    </>
                  )}
                </Button>
              </div>
            </Field>

            <Field>
              <Label htmlFor="bookmark-title">Title</Label>
              <Input
                id="bookmark-title"
                placeholder="Page Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <Label htmlFor="bookmark-desc">Description</Label>
              <textarea
                id="bookmark-desc"
                placeholder="What is this page about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="bookmark-folder">Folder</Label>
                <Select
                  value={folderId}
                  onValueChange={(val) => setFolderId(val || "none")}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="bookmark-folder" className="w-full">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">None (Root)</SelectItem>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="bookmark-read-time">Read Time (minutes)</Label>
                <Input
                  id="bookmark-read-time"
                  type="number"
                  min={1}
                  value={readTime}
                  onChange={(e) =>
                    setReadTime(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            <Field>
              <Label htmlFor="bookmark-tags">Tags (comma-separated)</Label>
              <Input
                id="bookmark-tags"
                placeholder="tech, inspiration, design"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={isSubmitting}
              />
              {parsedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {parsedTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Field>

            <Field className="flex-row items-center justify-between rounded-lg border border-border p-3 dark:border-zinc-800">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Favorite / Pin</span>
                <span className="text-xs text-zinc-500">
                  Pin this to the top of your feeds
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                disabled={isSubmitting}
                className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!url.trim() || !title.trim() || isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : bookmark
                  ? "Save Changes"
                  : "Add Bookmark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
