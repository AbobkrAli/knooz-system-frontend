import { PaginationBar } from "@/components/PaginationBar"
import { getHistory } from "@/lib/api"
import type { HistoryEntry } from "@/lib/api"
import { err, localeAr, roleAr } from "@/lib/ui-ar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useCallback, useEffect, useRef, useState } from "react"

const HISTORY_PAGE_SIZE = 20

const entityAr: Record<string, string> = {
  product: "منتج",
  user: "مستخدم",
  work_group: "مجموعة عمل",
  visit: "معاينة",
  selling_transaction: "معاملة مالية",
  inventory_transaction: "انشاء فاتورة داخلية",
  return: "مرتجع",
  auth: "دخول",
}

const actionAr: Record<string, string> = {
  create: "إنشاء",
  update: "تعديل",
  update_status: "تحديث حالة",
  login: "تسجيل دخول",
  create_outside_invoice: "إنشاء فاتورة خارجية",
}

export function HistoryPage({ token }: { token: string }) {
  const [items, setItems] = useState<HistoryEntry[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyTotalPages, setHistoryTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const historySearchDebounceReady = useRef(false)

  const fetchHistory = useCallback(
    (page: number) => {
      setLoading(true)
      getHistory(token, {
        page,
        limit: HISTORY_PAGE_SIZE,
        q: search.trim() || undefined,
      })
        .then((res) => {
          setItems(res.data)
          setHistoryTotal(res.total)
          setHistoryTotalPages(res.totalPages)
        })
        .catch(() => setError(err.load))
        .finally(() => setLoading(false))
    },
    [token, search]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      if (!historySearchDebounceReady.current) {
        historySearchDebounceReady.current = true
        setSearch(next)
        return
      }
      setSearch(next)
      setHistoryPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- paginated list fetch
    fetchHistory(historyPage)
  }, [fetchHistory, historyPage])

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">السجل التاريخي</h2>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <input
        className="w-full max-w-md rounded border bg-transparent px-2 py-1"
        placeholder="بحث في السجل…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {loading ? <p className="text-sm text-muted-foreground">جاري تحميل السجل…</p> : null}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>المستخدم</TableHead>
              <TableHead>الصلاحية</TableHead>
              <TableHead>الإجراء</TableHead>
              <TableHead>الكيان</TableHead>
              <TableHead>الوقت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  لا يوجد سجل مطابق للبحث.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{item.user.name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {item.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{roleAr(item.user.role)}</TableCell>
                  <TableCell>{actionAr[item.action] ?? item.action}</TableCell>
                  <TableCell>{entityAr[item.entity] ?? item.entity}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString(localeAr)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        page={historyPage}
        totalPages={historyTotalPages}
        total={historyTotal}
        loading={loading}
        onPageChange={setHistoryPage}
        noun="سجل"
      />
    </div>
  )
}
