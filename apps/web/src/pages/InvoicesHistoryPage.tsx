import { PaginationBar } from "@/components/PaginationBar"
import { getInvoicesHistory } from "@/lib/api"
import type { InvoiceHistoryEntry } from "@/lib/api"
import {
  exportInvoiceReceiptPdf,
  exportInvoiceReceiptPng,
  printInvoiceReceipt,
} from "@/lib/invoice-receipt-export"
import { err, localeAr, sellTypeAr } from "@/lib/ui-ar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDown, ChevronRight, FileImage, FileText, Printer } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const INVOICES_PAGE_SIZE = 20

export function InvoicesHistoryPage({ token }: { token: string }) {
  const [items, setItems] = useState<InvoiceHistoryEntry[]>([])
  const [invoicesPage, setInvoicesPage] = useState(1)
  const [invoicesTotal, setInvoicesTotal] = useState(0)
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "inside" | "outside">("all")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [receiptBusy, setReceiptBusy] = useState<{ id: string; kind: "png" | "pdf" | "print" } | null>(
    null,
  )
  const invoicesSearchDebounceReady = useRef(false)

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function runReceiptExport(invoice: InvoiceHistoryEntry, kind: "png" | "pdf" | "print") {
    if (receiptBusy) return
    setReceiptBusy({ id: invoice.id, kind })
    try {
      if (kind === "png") await exportInvoiceReceiptPng(invoice)
      else if (kind === "pdf") await exportInvoiceReceiptPdf(invoice)
      else await printInvoiceReceipt(invoice)
    } catch {
      // Export uses canvas / popup; failures are rare and usually environmental.
    } finally {
      setReceiptBusy(null)
    }
  }

  const fetchInvoices = useCallback(
    (page: number) => {
      setLoading(true)
      getInvoicesHistory(token, {
        page,
        limit: INVOICES_PAGE_SIZE,
        type: typeFilter,
        q: search.trim() || undefined,
      })
        .then((res) => {
          setItems(res.data)
          setInvoicesTotal(res.total)
          setInvoicesTotalPages(res.totalPages)
        })
        .catch(() => setError(err.load))
        .finally(() => setLoading(false))
    },
    [token, search, typeFilter]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      if (!invoicesSearchDebounceReady.current) {
        invoicesSearchDebounceReady.current = true
        setSearch(next)
        return
      }
      setSearch(next)
      setInvoicesPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- paginated list fetch
    fetchInvoices(invoicesPage)
  }, [fetchInvoices, invoicesPage])

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">سجل الفواتير</h2>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <input
          className="w-full max-w-md rounded border bg-transparent px-2 py-1"
          placeholder="بحث في الفواتير أو المنتجات…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="w-full max-w-xs">
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as typeof typeFilter)
              setInvoicesPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفواتير</SelectItem>
              <SelectItem value="inside">فاتورة داخلية</SelectItem>
              <SelectItem value="outside">فاتورة خارجية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">جاري تحميل سجل الفواتير…</p> : null}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead>النوع</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>مجموعة العمل</TableHead>
              <TableHead>إجمالي البيع</TableHead>
              <TableHead>تكلفة الشراء</TableHead>
              <TableHead>الربح</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead className="w-[1%] whitespace-nowrap">طباعة / تنزيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  لا توجد فواتير مطابقة.
                </TableCell>
              </TableRow>
            ) : (
              items.flatMap((invoice) => {
                const open = expandedIds.has(invoice.id)
                const rows = [
                  <TableRow key={invoice.id}>
                    <TableCell className="align-middle">
                      <button
                        type="button"
                        className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-expanded={open}
                        aria-label={open ? "إخفاء تفاصيل الفاتورة" : "عرض تفاصيل الفاتورة"}
                        onClick={() => toggleExpanded(invoice.id)}
                      >
                        {open ? (
                          <ChevronDown
                            className="size-4 motion-safe:transition-transform motion-safe:duration-200"
                            aria-hidden
                          />
                        ) : (
                          <ChevronRight
                            className="size-4 motion-safe:transition-transform motion-safe:duration-200"
                            aria-hidden
                          />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>{sellTypeAr(invoice.type)}</TableCell>
                    <TableCell>{invoice.visit.customerName}</TableCell>
                    <TableCell>{invoice.visit.workGroup?.name ?? "بدون مجموعة"}</TableCell>
                    <TableCell dir="ltr">{invoice.totalSell}</TableCell>
                    <TableCell dir="ltr">{invoice.totalBuyCost}</TableCell>
                    <TableCell dir="ltr">{invoice.benefit}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(invoice.createdAt).toLocaleString(localeAr)}
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-nowrap items-center justify-end gap-0.5">
                        <button
                          type="button"
                          className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                          aria-label="طباعة الفاتورة"
                          disabled={Boolean(receiptBusy)}
                          onClick={() => void runReceiptExport(invoice, "print")}
                        >
                          <Printer className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                          aria-label="تنزيل الفاتورة كصورة"
                          disabled={Boolean(receiptBusy)}
                          onClick={() => void runReceiptExport(invoice, "png")}
                        >
                          <FileImage className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                          aria-label="تنزيل الفاتورة PDF"
                          disabled={Boolean(receiptBusy)}
                          onClick={() => void runReceiptExport(invoice, "pdf")}
                        >
                          <FileText className="size-4" aria-hidden />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>,
                  <TableRow key={`${invoice.id}-items`} className="hover:bg-transparent">
                    <TableCell colSpan={9} className="border-b p-0">
                      <div
                        className={cn(
                          "grid overflow-hidden motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-out",
                          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="min-h-0">
                          <div className="bg-muted/20 px-2 pb-2 pt-1" aria-hidden={!open}>
                            <div className="rounded-md border bg-background p-2">
                              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                تفاصيل العناصر
                              </p>
                              <Table className="text-xs">
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead>المنتج</TableHead>
                                    <TableHead>الكمية</TableHead>
                                    <TableHead>سعر البيع</TableHead>
                                    <TableHead>سعر الشراء</TableHead>
                                    <TableHead>الربح</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {invoice.items.map((line) => (
                                    <TableRow key={line.id}>
                                      <TableCell>{line.product.name}</TableCell>
                                      <TableCell dir="ltr">{line.quantity}</TableCell>
                                      <TableCell dir="ltr">{line.unitSellPrice}</TableCell>
                                      <TableCell dir="ltr">{line.unitBuyPrice}</TableCell>
                                      <TableCell dir="ltr">{line.lineBenefit}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>,
                ]
                return rows
              })
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        page={invoicesPage}
        totalPages={invoicesTotalPages}
        total={invoicesTotal}
        loading={loading}
        onPageChange={setInvoicesPage}
        noun="فاتورة"
      />
    </div>
  )
}
