import Script from 'next/script';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page pageBlur" data-loading="false">
      <Header />
      <div className="realContent">{children}</div>
      <Footer />
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
