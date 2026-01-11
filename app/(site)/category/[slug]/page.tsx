import { PostCard } from '@/components/PostCard';
import { getCategories, getPostsByCategory } from '@/lib/jsonDb';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return buildMetadata({
    title: `Category • ${params.slug}`,
    description: `Posts filed under ${params.slug}.`,
    path: `/category/${params.slug}`
  });
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const [posts, categories] = await Promise.all([
    getPostsByCategory(params.slug),
    getCategories()
  ]);
  const category = categories.find((item) => item.slug === params.slug);

  return (
    <div>
      <div className="blogHeader">
        <h1 className="blogTitle">Category: {category?.name ?? params.slug}</h1>
        <p className="blogSubtitle">{category?.description ?? 'Filtered stories.'}</p>
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
