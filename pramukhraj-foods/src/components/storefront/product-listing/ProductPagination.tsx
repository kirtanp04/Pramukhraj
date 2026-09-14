interface ProductPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ProductPagination({ currentPage, totalPages, onPageChange }: ProductPaginationProps) {
  if (totalPages <= 1) return null

  const pages = getVisiblePages(currentPage, totalPages)

  return (
    <nav aria-label="Product pagination" className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-full px-3 py-2 text-sm text-ink-soft hover:bg-ink/5 disabled:pointer-events-none disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((page, index) => page === 'ellipsis' ? (
        <span key={`ellipsis-${index}`} className="px-1 text-ink-soft" aria-hidden="true">…</span>
      ) : (
          <button
            type="button"
            key={page}
            onClick={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`h-9 w-9 rounded-full text-sm ${
              currentPage === page
                ? 'bg-oxblood text-ivory'
                : 'text-ink-soft hover:bg-ink/5'
            }`}
          >
            {page}
          </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-full px-3 py-2 text-sm text-ink-soft hover:bg-ink/5 disabled:pointer-events-none disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  )
}

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set([1, totalPages])
  for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page += 1) {
    pages.add(page)
  }

  const sortedPages = [...pages].sort((left, right) => left - right)
  const result: Array<number | 'ellipsis'> = []
  sortedPages.forEach((page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) result.push('ellipsis')
    result.push(page)
  })
  return result
}
