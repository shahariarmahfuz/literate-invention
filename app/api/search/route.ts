import { NextResponse } from 'next/server';
import { searchPosts } from '@/lib/jsonDb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const results = await searchPosts(query);
  return NextResponse.json(
    results.map((post) => ({
      slug: post.slug,
      title: post.title,
      coverImage: post.coverImage,
      excerpt: post.excerpt
    }))
  );
}
