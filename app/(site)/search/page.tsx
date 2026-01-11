import { PostCard } from '@/components/PostCard';
import { searchPosts } from '@/lib/jsonDb';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  searchParams
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const query = searchParams.q ?? '';
  return buildMetadata({
    title: query ? `Search • ${query}` : 'Search',
    description: query ? `Search results for ${query}.` : 'Search the blog.',
    path: query ? `/search?q=${encodeURIComponent(query)}` : '/search'
  });
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q ?? '';
  const results = await searchPosts(query);

  return (
    <div>
      <div className="blogHeader">
        <h1 className="blogTitle">Search</h1>
        <p className="blogSubtitle">{query ? `Results for "${query}"` : 'Type a query to begin.'}</p>
      </div>
      <main>
        <div className="latestList">
          {results.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {query && results.length === 0 && <div className="emptyState">No results found.</div>}
        </div>
      </main>
    </div>
  );
}
