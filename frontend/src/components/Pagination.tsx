import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  buildPageHref: (page: number) => string;
};

const MAX_VISIBLE_PAGE_NUMBERS = 5;

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= MAX_VISIBLE_PAGE_NUMBERS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(MAX_VISIBLE_PAGE_NUMBERS / 2);
  const maxStartPage = totalPages - MAX_VISIBLE_PAGE_NUMBERS + 1;
  const startPage = Math.min(
    Math.max(currentPage - halfWindow, 1),
    maxStartPage
  );

  return Array.from(
    { length: MAX_VISIBLE_PAGE_NUMBERS },
    (_, index) => startPage + index
  );
}

export default function Pagination({
  currentPage,
  totalPages,
  buildPageHref,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages);
  const firstVisiblePage = visiblePages[0];
  const lastVisiblePage = visiblePages[visiblePages.length - 1];

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {currentPage > 1 && (
        <Link
          href={buildPageHref(currentPage - 1)}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
        >
          Previous
        </Link>
      )}

      {firstVisiblePage > 1 && (
        <>
          <Link
            href={buildPageHref(1)}
            className="flex h-10 min-w-10 items-center justify-center rounded-full border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
            aria-label="Go to page 1"
          >
            1
          </Link>
          <span className="px-1 text-sm text-gray-400" aria-hidden="true">
            ...
          </span>
        </>
      )}

      {visiblePages.map((page) => {
        const isActive = page === currentPage;

        return isActive ? (
          <span
            key={page}
            className="flex h-10 min-w-10 items-center justify-center rounded-full bg-black px-3 text-sm font-medium text-white"
            aria-current="page"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildPageHref(page)}
            className="flex h-10 min-w-10 items-center justify-center rounded-full border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
            aria-label={`Go to page ${page}`}
          >
            {page}
          </Link>
        );
      })}

      {lastVisiblePage < totalPages && (
        <>
          <span className="px-1 text-sm text-gray-400" aria-hidden="true">
            ...
          </span>
          <Link
            href={buildPageHref(totalPages)}
            className="flex h-10 min-w-10 items-center justify-center rounded-full border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
            aria-label={`Go to page ${totalPages}`}
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          href={buildPageHref(currentPage + 1)}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
