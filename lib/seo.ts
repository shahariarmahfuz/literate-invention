import type { Metadata } from 'next';
import type { Author, Post } from './types';

const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';
const siteName = 'Writo';

export const buildMetadata = ({
  title,
  description,
  path,
  image
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata => {
  const url = `${siteUrl}${path}`;
  const imageUrl = image ? `${siteUrl}${image}` : `${siteUrl}/images/placeholder.svg`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: 'article',
      images: [{ url: imageUrl }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl]
    }
  };
};

export const buildBlogPostingJsonLd = ({
  post,
  author
}: {
  post: Post;
  author: Author | undefined;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  description: post.excerpt,
  image: `${siteUrl}${post.coverImage}`,
  author: author
    ? {
        '@type': 'Person',
        name: author.name
      }
    : undefined,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${siteUrl}/post/${post.slug}`
  }
});

export const buildBreadcrumbJsonLd = (items: Array<{ name: string; path: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${siteUrl}${item.path}`
  }))
});
