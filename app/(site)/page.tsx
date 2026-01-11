import { TrendingCarousel } from '@/components/TrendingCarousel';
import { PostCard } from '@/components/PostCard';
import { getFeaturedPosts, getPosts, getTrendingPosts } from '@/lib/jsonDb';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Writo • Home',
  description: 'Discover trending, featured, and fresh stories from Writo.',
  path: '/'
});

export default async function HomePage() {
  const [trending, featured, posts] = await Promise.all([
    getTrendingPosts(),
    getFeaturedPosts(),
    getPosts()
  ]);
  const recent = [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 10);

  return (
    <div>
      <TrendingCarousel posts={trending} />
      <main>
        <div className="sectionHead">
          <h2 className="sectionTitleHead">Featured</h2>
        </div>
        <div className="latestList">
          {featured.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="sectionHead">
          <h2 className="sectionTitleHead">Recent</h2>
        </div>
        <div className="latestList">
          {recent.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}
