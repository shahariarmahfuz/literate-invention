import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdjacentPosts, getAuthors, getPostBySlug } from '@/lib/jsonDb';
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return buildMetadata({ title: 'Post not found', description: 'Post not found.', path: `/post/${params.slug}` });
  }
  return buildMetadata({
    title: `${post.title} • Writo`,
    description: post.excerpt,
    path: `/post/${post.slug}`,
    image: post.coverImage
  });
}

export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }
  const [authors, adjacent] = await Promise.all([getAuthors(), getAdjacentPosts(post.slug)]);
  const author = authors.find((item) => item.id === post.authorId);
  const blogJsonLd = buildBlogPostingJsonLd({ post, author });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/post/${post.slug}` }
  ]);

  return (
    <article className="postDetail">
      <h1>{post.title}</h1>
      <div className="postMeta">
        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
        <span>{post.readingTime}</span>
        {author && <span>By {author.name}</span>}
      </div>
      <div className="postCover">
        <Image src={post.coverImage} alt={post.title} width={1200} height={630} />
      </div>
      <div className="postContent" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      <div className="postTags">
        {post.categories.map((category) => (
          <Link key={category} href={`/category/${category}`} className="badge">
            {category}
          </Link>
        ))}
        {post.tags.map((tag) => (
          <Link key={tag} href={`/tag/${tag}`} className="badge">
            #{tag}
          </Link>
        ))}
      </div>
      <div className="postNav">
        {adjacent.previous ? (
          <Link href={`/post/${adjacent.previous.slug}`}>← {adjacent.previous.title}</Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link href={`/post/${adjacent.next.slug}`}>{adjacent.next.title} →</Link>
        ) : (
          <span />
        )}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </article>
  );
}
