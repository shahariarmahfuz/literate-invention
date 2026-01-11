import { NextResponse } from 'next/server';
import { deletePost, updatePost } from '@/lib/jsonDb';
import type { Post } from '@/lib/types';

const isAuthorized = (request: Request) => {
  const password = process.env.ADMIN_PASSWORD ?? '';
  const provided = request.headers.get('x-admin-password') ?? '';
  return password.length > 0 && password === provided;
};

export async function PUT(request: Request, context: { params: { slug: string } }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = (await request.json()) as Partial<Post>;
  const updated = await updatePost(context.params.slug, payload);
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, context: { params: { slug: string } }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const deleted = await deletePost(context.params.slug);
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
