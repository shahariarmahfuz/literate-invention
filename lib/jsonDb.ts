import { unstable_cache } from 'next/cache';
import path from 'path';
import { promises as fs } from 'fs';
import type { Author, Category, Post, Tag } from './types';

const dataDir = path.join(process.cwd(), 'data');

const fileMap = {
  posts: 'posts.json',
  categories: 'categories.json',
  tags: 'tags.json',
  authors: 'authors.json'
} as const;

const getFilePath = (fileName: string) => path.join(dataDir, fileName);

const readJson = async <T>(fileName: string, fallback: T): Promise<T> => {
  try {
    const filePath = getFilePath(fileName);
    const contents = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(contents) as T;
  } catch {
    return fallback;
  }
};

const writeJsonAtomic = async <T>(fileName: string, data: T): Promise<void> => {
  const filePath = getFilePath(fileName);
  const tempPath = `${filePath}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(tempPath, payload, 'utf-8');
  await fs.rename(tempPath, filePath);
};

export const readPostsDirect = () => readJson<Post[]>(fileMap.posts, []);

export const getPosts = unstable_cache(
  () => readJson<Post[]>(fileMap.posts, []),
  ['posts'],
  { revalidate: 60 }
);

export const getCategories = unstable_cache(
  () => readJson<Category[]>(fileMap.categories, []),
  ['categories'],
  { revalidate: 300 }
);

export const getTags = unstable_cache(
  () => readJson<Tag[]>(fileMap.tags, []),
  ['tags'],
  { revalidate: 300 }
);

export const getAuthors = unstable_cache(
  () => readJson<Author[]>(fileMap.authors, []),
  ['authors'],
  { revalidate: 300 }
);

export const getPostBySlug = async (slug: string): Promise<Post | undefined> => {
  const posts = await getPosts();
  return posts.find((post) => post.slug === slug);
};

export const getAdjacentPosts = async (slug: string): Promise<{ previous?: Post; next?: Post }> => {
  const posts = await getPosts();
  const sorted = [...posts].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
  const index = sorted.findIndex((post) => post.slug === slug);
  if (index === -1) {
    return {};
  }
  return {
    previous: sorted[index - 1],
    next: sorted[index + 1]
  };
};

export const createPost = async (post: Post): Promise<Post> => {
  const posts = await readJson<Post[]>(fileMap.posts, []);
  const nextPosts = [post, ...posts];
  await writeJsonAtomic(fileMap.posts, nextPosts);
  return post;
};

export const updatePost = async (slug: string, updates: Partial<Post>): Promise<Post | null> => {
  const posts = await readJson<Post[]>(fileMap.posts, []);
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) {
    return null;
  }
  const updated = { ...posts[index], ...updates, updatedAt: new Date().toISOString() };
  const nextPosts = [...posts];
  nextPosts[index] = updated;
  await writeJsonAtomic(fileMap.posts, nextPosts);
  return updated;
};

export const deletePost = async (slug: string): Promise<boolean> => {
  const posts = await readJson<Post[]>(fileMap.posts, []);
  const nextPosts = posts.filter((post) => post.slug !== slug);
  if (nextPosts.length === posts.length) {
    return false;
  }
  await writeJsonAtomic(fileMap.posts, nextPosts);
  return true;
};

export const searchPosts = async (query: string): Promise<Post[]> => {
  const posts = await getPosts();
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  return posts.filter((post) => {
    const haystack = `${post.title} ${post.excerpt} ${post.contentHtml}`.toLowerCase();
    return haystack.includes(normalized);
  });
};

export const getPostsByCategory = async (slug: string): Promise<Post[]> => {
  const posts = await getPosts();
  return posts.filter((post) => post.categories.includes(slug));
};

export const getPostsByTag = async (slug: string): Promise<Post[]> => {
  const posts = await getPosts();
  return posts.filter((post) => post.tags.includes(slug));
};

export const getFeaturedPosts = async (): Promise<Post[]> => {
  const posts = await getPosts();
  return posts.filter((post) => post.featured);
};

export const getTrendingPosts = async (): Promise<Post[]> => {
  const posts = await getPosts();
  return posts.filter((post) => post.trending);
};
