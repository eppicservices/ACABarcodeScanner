'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) {
    return (
      <div className="pagination-container">
        <span className="pagination-info">
          Showing {startItem}-{endItem} of {totalItems}
        </span>
        <style jsx>{`
          .pagination-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: var(--white);
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--gray-100);
          }
          .pagination-info {
            font-size: 13px;
            color: var(--gray-500);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="pagination-container">
      <span className="pagination-info">
        Showing {startItem}-{endItem} of {totalItems}
      </span>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          aria-label="Previous page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="pagination-pages">
          {getPageNumbers().map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={page}
                className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
                disabled={isLoading}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          aria-label="Next page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .pagination-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--white);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--gray-100);
          gap: 16px;
        }

        .pagination-info {
          font-size: 13px;
          color: var(--gray-500);
          white-space: nowrap;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: var(--white);
          color: var(--gray-600);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: var(--aca-teal);
          color: var(--aca-teal);
          background: var(--aca-teal-subtle);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-pages {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pagination-page {
          min-width: 36px;
          height: 36px;
          padding: 0 12px;
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: var(--white);
          color: var(--gray-600);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-body);
        }

        .pagination-page:hover:not(:disabled):not(.active) {
          border-color: var(--gray-300);
          background: var(--gray-50);
        }

        .pagination-page.active {
          background: var(--aca-teal);
          border-color: var(--aca-teal);
          color: var(--white);
        }

        .pagination-page:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pagination-ellipsis {
          padding: 0 8px;
          color: var(--gray-400);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .pagination-container {
            flex-direction: column;
            gap: 12px;
            padding: 14px 16px;
          }

          .pagination-info {
            font-size: 12px;
          }

          .pagination-btn,
          .pagination-page {
            width: 32px;
            height: 32px;
            min-width: 32px;
          }

          .pagination-page {
            padding: 0 8px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .pagination-pages {
            gap: 2px;
          }

          .pagination-btn,
          .pagination-page {
            width: 28px;
            height: 28px;
            min-width: 28px;
          }

          .pagination-ellipsis {
            padding: 0 4px;
          }
        }
      `}</style>
    </div>
  )
}
