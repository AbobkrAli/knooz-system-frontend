import { localeAr } from "@/lib/ui-ar"

type PaginationBarProps = {
  page: number
  totalPages: number
  total: number
  loading: boolean
  onPageChange: (page: number) => void
  noun?: string
}

export function PaginationBar({
  page,
  totalPages,
  total,
  loading,
  onPageChange,
  noun = "نتيجة",
}: PaginationBarProps) {
  if (!loading && total === 0) {
    return null
  }

  const pages = Math.max(1, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
      <p className="text-muted-foreground">
        {loading
          ? "جاري التحميل…"
          : `صفحة ${page} من ${pages} — ${total.toLocaleString(localeAr)} ${noun}`}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1 text-xs disabled:opacity-50"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          السابق
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1 text-xs disabled:opacity-50"
          disabled={loading || page >= totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
        >
          التالي
        </button>
      </div>
    </div>
  )
}
