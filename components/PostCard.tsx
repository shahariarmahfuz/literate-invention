import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import { BookmarkButton } from './BookmarkButton';

type PostCardProps = {
  post: Post;
  categoryLabel?: string;
};

export const PostCard = ({ post, categoryLabel }: PostCardProps) => (
  <article className="latestCard">
    <div className="thumb imgBox">
      <Link href={`/post/${post.slug}`}>
        <Image src={post.coverImage} alt={post.title} width={800} height={400} />
      </Link>
    </div>
    <div className="content">
      <div className="badgeRow">
        {post.categories.map((category) => (
          <span key={category} className="badge">{category}</span>
        ))}
        {categoryLabel && <span className="badge">{categoryLabel}</span>}
      </div>
      <Link href={`/post/${post.slug}`} className="title">
        {post.title}
      </Link>
      <p className="excerpt">{post.excerpt}</p>
      <div className="metaRow">
        <small>{new Date(post.publishedAt).toLocaleDateString()}</small>
        <BookmarkButton slug={post.slug} title={post.title} coverImage={post.coverImage} category={post.categories[0]} />
      </div>
    </div>
  </article>
);
