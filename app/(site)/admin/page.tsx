'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Post } from '@/lib/types';

const emptyForm: Post = {
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  contentHtml: '',
  coverImage: '/images/placeholder.svg',
  authorId: 'author-1',
  categories: [],
  tags: [],
  publishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  featured: false,
  trending: false,
  readingTime: '3 min read'
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<Post>(emptyForm);
  const [status, setStatus] = useState<string>('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const headers = useMemo(() => ({ 'x-admin-password': password }), [password]);

  const loadPosts = async () => {
    if (!password) {
      return;
    }
    const res = await fetch('/api/posts', { headers });
    if (!res.ok) {
      setStatus('Invalid password.');
      return;
    }
    const data = await res.json();
    setPosts(data);
    setStatus('');
  };

  useEffect(() => {
    loadPosts();
  }, [password]);

  const updateField = (field: keyof Post, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setEditingSlug(null);
  };

  const submit = async () => {
    if (!password) {
      setStatus('Enter admin password.');
      return;
    }
    const payload = {
      ...form,
      categories: form.categories,
      tags: form.tags
    };

    const response = editingSlug
      ? await fetch(`/api/posts/${editingSlug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload)
        })
      : await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload)
        });

    if (!response.ok) {
      setStatus('Unable to save post.');
      return;
    }

    await loadPosts();
    resetForm();
    setStatus('Saved successfully.');
  };

  const editPost = (post: Post) => {
    setForm(post);
    setEditingSlug(post.slug);
  };

  const removePost = async (slug: string) => {
    if (!password) {
      return;
    }
    const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE', headers });
    if (!res.ok) {
      setStatus('Unable to delete post.');
      return;
    }
    await loadPosts();
    setStatus('Post deleted.');
  };

  return (
    <div className="adminWrap">
      <div className="adminCard">
        <h1 className="blogTitle">Admin</h1>
        <p className="blogSubtitle">Create, edit, or delete posts from JSON.</p>
        <div className="adminForm">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="btn" type="button" onClick={loadPosts}>Load Posts</button>
          {status && <div className="hint">{status}</div>}
        </div>
      </div>

      <div className="adminCard">
        <h2 className="blogTitle" style={{ fontSize: '18px' }}>{editingSlug ? 'Edit Post' : 'Create Post'}</h2>
        <div className="adminForm">
          <div className="adminRow">
            <div>
              <label>Title</label>
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
            </div>
            <div>
              <label>Slug</label>
              <input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} />
            </div>
          </div>
          <textarea
            rows={3}
            placeholder="Excerpt"
            value={form.excerpt}
            onChange={(event) => updateField('excerpt', event.target.value)}
          />
          <textarea
            rows={6}
            placeholder="Content HTML"
            value={form.contentHtml}
            onChange={(event) => updateField('contentHtml', event.target.value)}
          />
          <div className="adminRow">
            <div>
              <label>Cover Image</label>
              <input value={form.coverImage} onChange={(event) => updateField('coverImage', event.target.value)} />
            </div>
            <div>
              <label>Author ID</label>
              <input value={form.authorId} onChange={(event) => updateField('authorId', event.target.value)} />
            </div>
          </div>
          <div className="adminRow">
            <div>
              <label>Categories (comma separated)</label>
              <input
                value={form.categories.join(', ')}
                onChange={(event) => updateField('categories', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))}
              />
            </div>
            <div>
              <label>Tags (comma separated)</label>
              <input
                value={form.tags.join(', ')}
                onChange={(event) => updateField('tags', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))}
              />
            </div>
          </div>
          <div className="adminRow">
            <div>
              <label>Published At</label>
              <input value={form.publishedAt} onChange={(event) => updateField('publishedAt', event.target.value)} />
            </div>
            <div>
              <label>Reading Time</label>
              <input value={form.readingTime} onChange={(event) => updateField('readingTime', event.target.value)} />
            </div>
          </div>
          <div className="adminRow">
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => updateField('featured', event.target.checked)}
              />{' '}
              Featured
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.trending}
                onChange={(event) => updateField('trending', event.target.checked)}
              />{' '}
              Trending
            </label>
          </div>
          <div className="adminActions">
            <button className="btn" type="button" onClick={submit}>{editingSlug ? 'Update' : 'Create'}</button>
            {editingSlug && <button className="btn" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </div>
      </div>

      <div className="adminCard">
        <h2 className="blogTitle" style={{ fontSize: '18px' }}>Posts</h2>
        <div className="adminForm">
          {posts.map((post) => (
            <div key={post.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <strong>{post.title}</strong>
              <div className="adminActions" style={{ marginTop: '8px' }}>
                <button className="btn" type="button" onClick={() => editPost(post)}>Edit</button>
                <button className="btn" type="button" onClick={() => removePost(post.slug)}>Delete</button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <div className="emptyState">No posts found.</div>}
        </div>
      </div>
    </div>
  );
}
