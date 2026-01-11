import Link from 'next/link';
import Script from 'next/script';
import './post.css';

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="read-body">
      <nav className="read-nav">
        <div
          className="container"
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px'
          }}
        >
          <Link href="/" className="brand-logo">
            <span data-lucide="book-open"></span> Writo
          </Link>
          <div className="read-header-actions">
            <Link href="/" className="read-btn">Home</Link>
            <Link href="/blog" className="read-btn">Blog</Link>
          </div>
        </div>
      </nav>
      <div className="main-article-wrap">{children}</div>
      <footer className="read-footer">
        <p>Published on <strong>Writo</strong> Platform © 2026</p>
      </footer>
      <Script
        src="https://unpkg.com/lucide@latest"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as Window & { lucide?: { createIcons: () => void } }).lucide) {
            (window as Window & { lucide?: { createIcons: () => void } }).lucide?.createIcons();
          }
        }}
      />
    </div>
  );
}
