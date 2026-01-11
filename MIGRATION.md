# Migration Guide: Python Blog → Next.js (App Router)

This project mirrors your existing HTML/CSS by keeping the same class names and layout wrappers. Use the guide below to preserve styling.

## 1) Global styles (base layout)

**Location:** `app/globals.css`

Paste **the entire contents** of your existing base stylesheet (from `templates/base_user.html` inside the `<style>` tag) at the top of `app/globals.css`. The file already includes the copied styles; replace them with your full CSS if you want exact parity.

## 2) Reading mode (post detail layout)

**Location:** `app/(reading)/post/post.css`

Paste the CSS from `templates/base_post.html` `<style>` into `app/(reading)/post/post.css`. The layout structure in `app/(reading)/post/layout.tsx` matches the existing `base_post.html` markup so the styles will map cleanly.

## 3) Page-specific styles

If you have page-level styles (for example, the `<style>` block in `templates/index.html`):

- **Home page:** copy those CSS rules into `app/globals.css` under the "Home + list components" section.
- **Blog list:** keep list-related rules in `app/globals.css` under the same section.
- **Admin page:** add admin-only styles in `app/globals.css` under the "admin" section.

## 4) HTML structure mapping

Use this mapping to paste existing HTML markup into the new files without changing class names:

- **Header + modals + sidebar:** `components/Header.tsx`
- **Footer:** `components/Footer.tsx`
- **Home page:** `app/(site)/page.tsx`
- **Blog list:** `app/(site)/blog/page.tsx`
- **Post detail:** `app/(reading)/post/[slug]/page.tsx`
- **Category + Tag pages:** `app/(site)/category/[slug]/page.tsx`, `app/(site)/tag/[slug]/page.tsx`
- **Search page:** `app/(site)/search/page.tsx`
- **Admin page:** `app/(site)/admin/page.tsx`

## 5) Data + content

- **JSON data:** edit `data/posts.json`, `data/categories.json`, `data/tags.json`, `data/authors.json`.
- **Post HTML:** keep using `contentHtml` to store your existing HTML content. It is rendered as-is in `app/(reading)/post/[slug]/page.tsx`.

## 6) Images

Place your images under `public/` and update JSON paths to match (e.g. `/images/cover.jpg`). The UI uses `next/image`, so the layout stays the same.

## 7) Admin password

Set `ADMIN_PASSWORD` in `.env` to protect `/admin` and API routes.

