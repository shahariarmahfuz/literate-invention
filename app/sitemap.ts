import type { MetadataRoute } from 'next';
import { getCategories, getPosts, getTags } from '@/lib/jsonDb';

const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags] = await Promise.all([getPosts(), getCategories(), getTags()]);
  const routes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: new Date() },
    { url: `${siteUrl}/blog`, lastModified: new Date() }
  ];

  posts.forEach((post) => {
    routes.push({
      url: `${siteUrl}/post/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt)
    });
  });

  categories.forEach((category) => {
    routes.push({ url: `${siteUrl}/category/${category.slug}`, lastModified: new Date() });
  });

  tags.forEach((tag) => {
    routes.push({ url: `${siteUrl}/tag/${tag.slug}`, lastModified: new Date() });
  });

  return routes;
}
