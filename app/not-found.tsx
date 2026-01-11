import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="blogHeader">
      <h1 className="blogTitle">404</h1>
      <p className="blogSubtitle">The page you are looking for does not exist.</p>
      <Link href="/" className="viewAllLink">Back to home</Link>
    </div>
  );
}
