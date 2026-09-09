interface ProductPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ProductPagination({ currentPage, totalPages, onPageChange }: ProductPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Product pagination" className="mt-8 flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1
        return (
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
        )
      })}
    </nav>
  )
}
