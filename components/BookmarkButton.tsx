'use client';

import { useMemo } from 'react';
import { useBookmarks } from './useBookmarks';

type BookmarkButtonProps = {
  slug: string;
  title: string;
  coverImage: string;
  category?: string;
};

export const BookmarkButton = ({ slug, title, coverImage, category }: BookmarkButtonProps) => {
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const active = useMemo(() => isBookmarked(slug), [isBookmarked, slug]);

  return (
    <button
      type="button"
      className={`bookmarkBtn${active ? ' active' : ''}`}
      onClick={() => toggleBookmark({ slug, title, coverImage, category })}
    >
      {active ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
};
