import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { getPosts } from '@/lib/jsonDb';
import { paginate } from '@/lib/pagination';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Writo • Blog',
  description: 'Browse every Writo post with pagination.',
  path: '/blog'
});

export default async function BlogPage({
  searchParams
}: {
  searchParams: { page?: string };
}) {
  const page = Number(searchParams.page ?? '1');
  const posts = await getPosts();
  const sorted = [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const pagination = paginate(sorted, page, 10);

  return (
    <div>
      <div className="blogHeader">
        <h1 className="blogTitle">All Posts</h1>
        <p className="blogSubtitle">Latest stories from the Writo team.</p>
      </div>
      <main>
        <div className="latestList">
          {pagination.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} basePath="/blog" />
      </main>
    </div>
  );
}
