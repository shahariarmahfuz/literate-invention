import Link from 'next/link';

export const Pagination = ({
  currentPage,
  totalPages,
  basePath
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="pagination">
      {pages.map((page) => (
        <Link
          key={page}
          href={`${basePath}?page=${page}`}
          className={page === currentPage ? 'active' : ''}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
};
