import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy • Writo',
  description: 'Privacy policy for Writo.',
  path: '/privacy'
});

export default function PrivacyPage() {
  return (
    <div className="blogHeader">
      <h1 className="blogTitle">Privacy</h1>
      <p className="blogSubtitle">Add your privacy policy here.</p>
    </div>
  );
}
