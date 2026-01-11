'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Post } from '@/lib/types';

type TrendingCarouselProps = {
  posts: Post[];
};

export const TrendingCarousel = ({ posts }: TrendingCarouselProps) => {
  const items = useMemo(() => posts.slice(0, 5), [posts]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [items.length]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const lucide = (window as Window & { lucide?: { createIcons: () => void } }).lucide;
    lucide?.createIcons();
  }, [items.length, activeIndex]);

  if (items.length === 0) {
    return null;
  }

  const goTo = (index: number) => setActiveIndex(index);

  return (
    <div className="trendWrap">
      <div className="carousel">
        <div className="slides">
          {items.map((post, index) => (
            <Image
              key={post.slug}
              src={post.coverImage}
              alt={post.title}
              width={1200}
              height={450}
              className={index === activeIndex ? 'active' : ''}
            />
          ))}
        </div>
        <div className="overlay"></div>
        <div className="slide-title">{items[activeIndex]?.title}</div>
        <button className="arrow left" type="button" onClick={() => goTo((activeIndex - 1 + items.length) % items.length)} aria-label="Previous">
          <span data-lucide="chevron-left"></span>
        </button>
        <button className="arrow right" type="button" onClick={() => goTo((activeIndex + 1) % items.length)} aria-label="Next">
          <span data-lucide="chevron-right"></span>
        </button>
        <Link className="link-icon" href={`/post/${items[activeIndex]?.slug}`} aria-label="Open post">
          <span data-lucide="link-2"></span>
        </Link>
        <div className="dots">
          {items.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              className={`dot${index === activeIndex ? ' active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
