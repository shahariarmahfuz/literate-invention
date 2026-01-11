import { NextResponse } from 'next/server';
import { createPost, readPostsDirect } from '@/lib/jsonDb';
import type { Post } from '@/lib/types';

const isAuthorized = (request: Request) => {
  const password = process.env.ADMIN_PASSWORD ?? '';
  const provided = request.headers.get('x-admin-password') ?? '';
  return password.length > 0 && password === provided;
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const posts = await readPostsDirect();
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = (await request.json()) as Post;
  const post: Post = {
    ...payload,
    id: payload.id || `post-${Date.now()}`,
    updatedAt: new Date().toISOString()
  };
  const created = await createPost(post);
  return NextResponse.json(created, { status: 201 });
}
