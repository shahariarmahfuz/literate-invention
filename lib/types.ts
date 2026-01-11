export type Author = {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  role: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type Tag = {
  id: string;
  slug: string;
  name: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string;
  authorId: string;
  categories: string[];
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  featured: boolean;
  trending: boolean;
  readingTime: string;
};
