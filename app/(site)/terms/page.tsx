import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Terms • Writo',
  description: 'Terms and conditions for Writo.',
  path: '/terms'
});

export default function TermsPage() {
  return (
    <div className="blogHeader">
      <h1 className="blogTitle">Terms</h1>
      <p className="blogSubtitle">Add your terms and conditions here.</p>
    </div>
  );
}
