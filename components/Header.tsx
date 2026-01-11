'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBookmarks } from './useBookmarks';

type SearchResult = {
  slug: string;
  title: string;
  coverImage: string;
  excerpt: string;
};

const refreshIcons = () => {
  if (typeof window === 'undefined') {
    return;
  }
  const lucide = (window as Window & { lucide?: { createIcons: () => void } }).lucide;
  lucide?.createIcons();
};

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { bookmarks, removeBookmark } = useBookmarks();

  useEffect(() => {
    const saved = window.localStorage.getItem('writoTheme');
    const nextTheme = saved === 'dark' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.body.setAttribute('data-theme', nextTheme);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menuOpen', menuOpen);
    document.body.classList.toggle('hasOverlay', menuOpen || searchOpen || bookmarkOpen || translateOpen);
  }, [menuOpen, searchOpen, bookmarkOpen, translateOpen]);

  useEffect(() => {
    refreshIcons();
  }, [theme, menuOpen, searchOpen, bookmarkOpen, translateOpen, searchResults]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.body.setAttribute('data-theme', next);
    window.localStorage.setItem('writoTheme', next);
  }, [theme]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: SearchResult[]) => setSearchResults(data))
      .catch(() => undefined);

    return () => controller.abort();
  }, [query]);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setBookmarkOpen(false);
    setTranslateOpen(false);
  }, []);

  const overlayActive = useMemo(() => menuOpen || searchOpen || bookmarkOpen || translateOpen, [
    menuOpen,
    searchOpen,
    bookmarkOpen,
    translateOpen
  ]);

  return (
    <>
      <header>
        <div className="headerLeft">
          <button className="iconBtn" type="button" aria-label="Open menu" onClick={() => {
            closeAll();
            setMenuOpen(true);
          }}>
            <span data-lucide="menu"></span>
          </button>
          <Link className="brandTitle" href="/">Writo</Link>
        </div>

        <div className="headerRight">
          <button className="iconBtn" type="button" aria-label="Search" onClick={() => {
            closeAll();
            setSearchOpen(true);
          }}>
            <span data-lucide="search"></span>
          </button>
          <button className="iconBtn" type="button" aria-label="Bookmarks" onClick={() => {
            closeAll();
            setBookmarkOpen(true);
          }}>
            <span data-lucide="bookmark"></span>
          </button>
          <button className="iconBtn" type="button" aria-label="Translate" onClick={() => {
            closeAll();
            setTranslateOpen(true);
          }}>
            <span data-lucide="languages"></span>
          </button>
          <button className="iconBtn" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
            <span data-lucide={theme === 'dark' ? 'sun' : 'moon'}></span>
          </button>
        </div>
      </header>

      <div className="overlayBg" onClick={closeAll} style={{ pointerEvents: overlayActive ? 'auto' : 'none' }} />

      <aside className="sideMenu">
        <div className="menuHeader">
          <button className="iconBtn" type="button" onClick={closeAll}>
            <span data-lucide="x"></span>
          </button>
        </div>
        <Link className="menuItem" href="/">
          <span data-lucide="home"></span>
          <span>Home</span>
        </Link>
        <Link className="menuItem" href="/blog">
          <span data-lucide="layers"></span>
          <span>All Posts</span>
        </Link>
        <Link className="menuItem" href="/admin">
          <span data-lucide="settings"></span>
          <span>Admin</span>
        </Link>
      </aside>

      <section className={`modal${searchOpen ? ' open' : ''}`} aria-hidden={!searchOpen}>
        <div className="modalInner">
          <div className="modalHead">
            <div className="modalTitle"><span data-lucide="search"></span> Search</div>
            <button className="modalClose" type="button" onClick={closeAll}><span data-lucide="x"></span></button>
          </div>
          <div className="inputRow">
            <input
              className="searchInput"
              type="search"
              placeholder="Type to search..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {searchResults.length === 0 && query.length >= 2 ? (
              <div className="emptyState">No results</div>
            ) : (
              searchResults.map((result) => (
                <Link
                  key={result.slug}
                  href={`/post/${result.slug}`}
                  className="menuItem"
                  onClick={closeAll}
                  style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}
                >
                  <span>{result.title}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className={`modal${bookmarkOpen ? ' open' : ''}`} aria-hidden={!bookmarkOpen}>
        <div className="modalInner">
          <div className="modalHead">
            <div className="modalTitle"><span data-lucide="bookmark"></span> Saved</div>
            <button className="modalClose" type="button" onClick={closeAll}><span data-lucide="x"></span></button>
          </div>
          {bookmarks.length === 0 ? (
            <div className="emptyState">No saved posts yet.</div>
          ) : (
            bookmarks.map((bookmark) => (
              <div key={bookmark.slug} style={{ display: 'flex', gap: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', alignItems: 'center' }}>
                <img src={bookmark.coverImage} alt={bookmark.title} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <Link href={`/post/${bookmark.slug}`} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none', display: 'block' }} onClick={closeAll}>
                    {bookmark.title}
                  </Link>
                  {bookmark.category && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{bookmark.category}</span>}
                </div>
                <button className="btn" type="button" onClick={() => removeBookmark(bookmark.slug)} style={{ height: '32px' }}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={`modal${translateOpen ? ' open' : ''}`} aria-hidden={!translateOpen}>
        <div className="modalInner">
          <div className="modalHead">
            <div className="modalTitle"><span data-lucide="languages"></span> Translate</div>
            <button className="modalClose" type="button" onClick={closeAll}><span data-lucide="x"></span></button>
          </div>
          <div className="pillGrid">
            <div className="langPill">Bangla</div>
            <div className="langPill">English</div>
          </div>
        </div>
      </section>
    </>
  );
};
