'use client';

import { useCallback, useEffect, useState } from 'react';

export type BookmarkItem = {
  slug: string;
  title: string;
  coverImage: string;
  category?: string;
};

const STORAGE_KEY = 'writoBookmarks';

const readBookmarks = (): BookmarkItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as BookmarkItem[];
  } catch {
    return [];
  }
};

const writeBookmarks = (items: BookmarkItem[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    setBookmarks(readBookmarks());
  }, []);

  const toggleBookmark = useCallback((item: BookmarkItem) => {
    setBookmarks((prev) => {
      const exists = prev.some((bookmark) => bookmark.slug === item.slug);
      const next = exists
        ? prev.filter((bookmark) => bookmark.slug !== item.slug)
        : [item, ...prev];
      writeBookmarks(next);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((slug: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((bookmark) => bookmark.slug !== slug);
      writeBookmarks(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (slug: string) => bookmarks.some((bookmark) => bookmark.slug === slug),
    [bookmarks]
  );

  return { bookmarks, toggleBookmark, removeBookmark, isBookmarked };
};
