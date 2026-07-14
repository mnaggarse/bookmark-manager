"use client";

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
import { Folder } from "@/hooks/use-bookmarks";
import * as React from "react";
import { useEffect, useState } from "react";

interface FolderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, parentId: string | null) => Promise<void>;
  folder?: Folder; // If provided, we are editing
  existingFolders: Folder[];
}

export function FolderDialog({
  isOpen,
  onOpenChange,
  onSave,
  folder,
  existingFolders,
}: FolderDialogProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when dialog opens or folder changes
  useEffect(() => {
    if (isOpen) {
      setName(folder ? folder.name : "");
      setParentId(folder && folder.parentId ? folder.parentId : "none");
    }
  }, [isOpen, folder]);

  // Compute valid parent folders (avoid nesting folder inside itself or its children)
  const getInvalidParentIds = (folderId: string): Set<string> => {
    const invalidIds = new Set<string>([folderId]);
    const queue = [folderId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = existingFolders.filter((f) => f.parentId === currentId);
      children.forEach((c) => {
        if (!invalidIds.has(c.id)) {
          invalidIds.add(c.id);
          queue.push(c.id);
        }
      });
    }
    return invalidIds;
  };

  const invalidParentIds = folder
    ? getInvalidParentIds(folder.id)
    : new Set<string>();
  const validParents = existingFolders.filter(
    (f) => !invalidParentIds.has(f.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const parentVal = parentId === "none" ? null : parentId;
      await onSave(name.trim(), parentVal);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save folder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{folder ? "Edit Folder" : "Create Folder"}</DialogTitle>
          <DialogDescription>
            {folder
              ? "Update this folder's name or location."
              : "Add a new folder to organize your bookmarks."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <Field>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="e.g. Work, Recipes, Inspo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <Label htmlFor="parent-folder">Parent Folder</Label>
              <Select
                value={parentId}
                onValueChange={(val) => setParentId(val || "none")}
                disabled={isSubmitting}
              >
                <SelectTrigger id="parent-folder" className="w-full">
                  <SelectValue placeholder="Select parent folder">
                    {parentId === "none"
                      ? "None (Root)"
                      : validParents.find((f) => f.id === parentId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">None (Root)</SelectItem>
                    {validParents.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : folder
                  ? "Save Changes"
                  : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
