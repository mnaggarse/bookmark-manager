"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string | null;
  tags: string[];
  folderId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  readTimeEstimate: number;
  isTrash: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export function useBookmarks(userId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to real-time updates for bookmarks and folders
  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      setFolders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const bookmarksRef = collection(db, "users", userId, "bookmarks");
    const bookmarksQuery = query(bookmarksRef, orderBy("createdAt", "desc"));

    const unsubscribeBookmarks = onSnapshot(
      bookmarksQuery,
      (snapshot) => {
        const list: Bookmark[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Bookmark);
        });
        setBookmarks(list);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to bookmarks:", error);
      },
    );

    const foldersRef = collection(db, "users", userId, "folders");
    const foldersQuery = query(foldersRef, orderBy("name", "asc"));

    const unsubscribeFolders = onSnapshot(
      foldersQuery,
      (snapshot) => {
        const list: Folder[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Folder);
        });
        setFolders(list);
      },
      (error) => {
        console.error("Error listening to folders:", error);
      },
    );

    return () => {
      unsubscribeBookmarks();
      unsubscribeFolders();
    };
  }, [userId]);

  // Operations: Bookmarks
  const addBookmark = async (
    bookmark: Omit<Bookmark, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (!userId) return;
    const docRef = doc(collection(db, "users", userId, "bookmarks"));
    const now = Date.now();
    await setDoc(docRef, {
      ...bookmark,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateBookmark = async (
    id: string,
    updates: Partial<Omit<Bookmark, "id" | "createdAt" | "updatedAt">>,
  ) => {
    if (!userId) return;
    const docRef = doc(db, "users", userId, "bookmarks", id);
    await setDoc(
      docRef,
      {
        ...updates,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  };

  const deleteBookmark = async (id: string, permanently = false) => {
    if (!userId) return;
    const docRef = doc(db, "users", userId, "bookmarks", id);
    if (permanently) {
      await deleteDoc(docRef);
    } else {
      await setDoc(
        docRef,
        {
          isTrash: true,
          isPinned: false, // unpin when trashed
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    }
  };

  const restoreBookmark = async (id: string) => {
    if (!userId) return;
    const docRef = doc(db, "users", userId, "bookmarks", id);
    await setDoc(
      docRef,
      {
        isTrash: false,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  };

  const emptyTrash = async () => {
    if (!userId) return;
    const trashedBookmarks = bookmarks.filter((b) => b.isTrash);
    if (trashedBookmarks.length === 0) return;

    const batch = writeBatch(db);
    trashedBookmarks.forEach((b) => {
      const docRef = doc(db, "users", userId, "bookmarks", b.id);
      batch.delete(docRef);
    });
    await batch.commit();
  };

  // Operations: Folders
  const addFolder = async (name: string, parentId: string | null = null) => {
    if (!userId) return;
    const docRef = doc(collection(db, "users", userId, "folders"));
    const now = Date.now();
    await setDoc(docRef, {
      id: docRef.id,
      name,
      parentId,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateFolder = async (
    id: string,
    name: string,
    parentId: string | null = null,
  ) => {
    if (!userId) return;
    const docRef = doc(db, "users", userId, "folders", id);
    await setDoc(
      docRef,
      {
        name,
        parentId,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  };

  const deleteFolder = async (folderId: string) => {
    if (!userId) return;

    const batch = writeBatch(db);

    // 1. Delete the folder itself
    const folderRef = doc(db, "users", userId, "folders", folderId);
    batch.delete(folderRef);

    // 2. Orphan child folders (move to root) or delete? Moving to root is safer.
    const childFolders = folders.filter((f) => f.parentId === folderId);
    childFolders.forEach((f) => {
      const childRef = doc(db, "users", userId, "folders", f.id);
      batch.update(childRef, { parentId: null, updatedAt: Date.now() });
    });

    // 3. Move bookmarks inside this folder to root folder (folderId = null)
    const folderBookmarks = bookmarks.filter((b) => b.folderId === folderId);
    folderBookmarks.forEach((b) => {
      const bookmarkRef = doc(db, "users", userId, "bookmarks", b.id);
      batch.update(bookmarkRef, { folderId: null, updatedAt: Date.now() });
    });

    await batch.commit();
  };

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      bookmarks
        .filter((b) => !b.isTrash)
        .flatMap((b) => b.tags || [])
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).sort();

  return {
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
  };
}
