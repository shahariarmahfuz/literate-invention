export type PaginationResult<T> = {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
};

export const paginate = <T>(items: T[], page: number, perPage: number): PaginationResult<T> => {
  const safePerPage = perPage > 0 ? perPage : 10;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePerPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * safePerPage;
  const end = start + safePerPage;
  return {
    items: items.slice(start, end),
    totalItems,
    totalPages,
    currentPage,
    perPage: safePerPage
  };
};
