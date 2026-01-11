import { PostCard } from '@/components/PostCard';
import { getPostsByTag, getTags } from '@/lib/jsonDb';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return buildMetadata({
    title: `Tag • ${params.slug}`,
    description: `Posts tagged with ${params.slug}.`,
    path: `/tag/${params.slug}`
  });
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const [posts, tags] = await Promise.all([getPostsByTag(params.slug), getTags()]);
  const tag = tags.find((item) => item.slug === params.slug);

  return (
    <div>
      <div className="blogHeader">
        <h1 className="blogTitle">Tag: {tag?.name ?? params.slug}</h1>
        <p className="blogSubtitle">Stories tagged with {tag?.name ?? params.slug}.</p>
      </div>
      <main>
        <div className="latestList">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}
