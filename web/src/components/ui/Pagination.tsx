type Props = {
  page: number
  pageCount: number
  disabled?: boolean
  onChange: (page: number) => void
}

export function Pagination({ page, pageCount, disabled, onChange }: Props) {
  return (
    <div className="pagination">
      <button type="button" disabled={disabled || page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page + 1} of {pageCount}
      </span>
      <button type="button" disabled={disabled || page === pageCount - 1} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  )
}
