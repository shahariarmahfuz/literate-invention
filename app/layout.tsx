import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Writo',
  description: 'Minimal, mobile-first stories.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap" rel="stylesheet" />
      </head>
      <body data-theme="light">{children}</body>
    </html>
  );
}
