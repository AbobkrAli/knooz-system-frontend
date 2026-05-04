import { InvoiceDraftLineRow } from "@/components/InvoiceDraftLineRow"
import {
  PopoverForm,
  PopoverFormBody,
  PopoverFormButton,
  PopoverFormField,
  PopoverFormSuccess,
  popoverFormControlClass,
} from "@/components/PopoverForm"
import { createReturn, getProducts, getReturns } from "@/lib/api"
import type { Product, ReturnEntry } from "@/lib/api"
import { formatMoneyAr, invoiceDraftTotals } from "@/lib/invoice-ui"
import { err, localeAr } from "@/lib/ui-ar"
import { PaginationBar } from "@/components/PaginationBar"
import { cn } from "@workspace/ui/lib/utils"
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
import type { FormEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const RETURNS_PAGE_SIZE = 20

export function ReturnsPage({ token }: { token: string }) {
  type ReturnLineDraft = { productId: string; quantity: string }
  const [items, setItems] = useState<ReturnEntry[]>([])
  const [returnsPage, setReturnsPage] = useState(1)
  const [returnsTotal, setReturnsTotal] = useState(0)
  const [returnsTotalPages, setReturnsTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [priceType, setPriceType] = useState<"inside" | "outside">("inside")
  const [returnLines, setReturnLines] = useState<ReturnLineDraft[]>([])
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const returnsSearchDebounceReady = useRef(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addState, setAddState] = useState<"idle" | "loading" | "success">("idle")

  const fetchReturns = useCallback(
    (page: number) => {
      setLoading(true)
      getReturns(token, {
        page,
        limit: RETURNS_PAGE_SIZE,
        q: search.trim() || undefined,
      })
        .then((res) => {
          setItems(res.data)
          setReturnsTotal(res.total)
          setReturnsTotalPages(res.totalPages)
        })
        .catch(() => setError(err.load))
        .finally(() => setLoading(false))
    },
    [token, search]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      if (!returnsSearchDebounceReady.current) {
        returnsSearchDebounceReady.current = true
        setSearch(next)
        return
      }
      setSearch(next)
      setReturnsPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- paginated list fetch
    fetchReturns(returnsPage)
  }, [fetchReturns, returnsPage])

  useEffect(() => {
    getProducts(token)
      .then((loadedProducts) => {
        setProducts(loadedProducts)
      })
      .catch(() => setError(err.load))
  }, [token])

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    if (returnLines.length === 0) {
      setError("أضف منتجًا واحدًا على الأقل.")
      return
    }
    for (const line of returnLines) {
      const product = products.find((p) => p.id === line.productId)
      const qty = Number(line.quantity)
      if (!product) {
        setError("أحد المنتجات المختارة غير موجود.")
        return
      }
      if (!Number.isFinite(qty) || qty < 1) {
        setError(`الكمية غير صالحة للمنتج ${product.name}.`)
        return
      }
      if (qty > product.quantity) {
        setError(`الكمية المطلوبة للمنتج ${product.name} تتجاوز المخزون (${product.quantity}).`)
        return
      }
    }
    try {
      setAddState("loading")
      await createReturn(token, {
        priceType,
        items: returnLines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
        })),
        reason,
      })
      setReturnLines([])
      setProductSearch("")
      setReason("")
      setPriceType("inside")
      setReturnsPage(1)
      setLoading(true)
      getReturns(token, {
        page: 1,
        limit: RETURNS_PAGE_SIZE,
        q: search.trim() || undefined,
      })
        .then((res) => {
          setItems(res.data)
          setReturnsTotal(res.total)
          setReturnsTotalPages(res.totalPages)
        })
        .catch(() => setError(err.load))
        .finally(() => setLoading(false))
      getProducts(token).then(setProducts)
      setSuccess("تم تسجيل المرتجع بنجاح.")
      setAddState("success")
      setTimeout(() => {
        setAddOpen(false)
        setAddState("idle")
      }, 900)
    } catch {
      setAddState("idle")
      setError(err.create)
    }
  }

  const addReturnLine = (productId: string) => {
    setReturnLines((prev) => {
      if (prev.some((line) => line.productId === productId)) {
        return prev
      }
      return [...prev, { productId, quantity: "1" }]
    })
  }

  const updateReturnLine = (productId: string, key: "quantity", value: string) => {
    setReturnLines((prev) =>
      prev.map((line) => (line.productId === productId ? { ...line, [key]: value } : line))
    )
  }

  const removeReturnLine = (productId: string) => {
    setReturnLines((prev) => prev.filter((line) => line.productId !== productId))
  }

  const returnDraftTotals = useMemo(
    () =>
      invoiceDraftTotals(
        returnLines,
        products,
        priceType === "inside" ? "sellPriceInside" : "sellPriceOutside",
      ),
    [returnLines, products, priceType],
  )

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">المرتجعات</h2>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
      <input
        className="w-full max-w-md rounded border bg-transparent px-2 py-1"
        placeholder="بحث في المرتجعات…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      <PopoverForm
          title="إضافة مرتجع"
          open={addOpen}
          setOpen={setAddOpen}
          width="980px"
          height="760px"
          showCloseButton={addState !== "success"}
          showSuccess={addState === "success"}
          openChild={
            <form className="flex h-full min-h-0 flex-col" onSubmit={onCreate}>
              <PopoverFormBody
                footer={
                  <div className="flex justify-end">
                    <PopoverFormButton loading={addState === "loading"} text="تسجيل مرتجع" />
                  </div>
                }
              >
                <div className="flex h-full min-h-0 flex-col gap-3">
                  <div className="shrink-0 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      يُحسب الاسترداد والملخص وفق نوع التسعير المختار (داخلي أو خارجي) وتكلفة الشراء
                      لكل منتج.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <PopoverFormField label="نوع التسعير" htmlFor="add-return-price-type">
                        <Select
                          value={priceType}
                          onValueChange={(v) => setPriceType(v as "inside" | "outside")}
                        >
                          <SelectTrigger id="add-return-price-type" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inside">داخلي</SelectItem>
                            <SelectItem value="outside">خارجي</SelectItem>
                          </SelectContent>
                        </Select>
                      </PopoverFormField>
                      <PopoverFormField label="السبب" htmlFor="add-return-reason">
                        <input
                          id="add-return-reason"
                          className={popoverFormControlClass}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          required
                        />
                      </PopoverFormField>
                    </div>
                    <PopoverFormField label="بحث عن منتج" htmlFor="add-return-product-search">
                      <input
                        id="add-return-product-search"
                        className={popoverFormControlClass}
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="ابحث بالاسم…"
                      />
                    </PopoverFormField>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col border-t border-border pt-3">
                    <div className="flex min-h-0 flex-1 flex-col gap-4 md:min-h-[300px] md:flex-row md:items-stretch md:gap-0">
                      <div className="flex w-full min-h-[min(20rem,44svh)] flex-none flex-col md:min-h-0 md:flex-1 md:pe-3">
                        <p className="mb-2 shrink-0 text-xs font-semibold text-muted-foreground">
                          المنتجات في المخزن
                        </p>
                        <div className="min-h-[min(16rem,38svh)] flex-1 basis-0 space-y-2 overflow-y-auto rounded-md border bg-background p-2 md:min-h-0">
                          {(() => {
                            const q = productSearch.toLowerCase()
                            const addedIds = new Set(returnLines.map((l) => l.productId))
                            const available = products
                              .filter((p) => !addedIds.has(p.id))
                              .filter((p) => p.name.toLowerCase().includes(q))
                              .sort((a, b) =>
                                a.name.localeCompare(b.name, localeAr, { sensitivity: "base" }),
                              )
                            if (available.length === 0) {
                              return (
                                <p className="text-xs text-muted-foreground">
                                  {returnLines.length === products.length
                                    ? "كل المنتجات مضافة للمرتجع."
                                    : "لا توجد منتجات مطابقة للبحث."}
                                </p>
                              )
                            }
                            return available.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className={cn(
                                  "flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-xs hover:bg-muted",
                                  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-end-2 motion-safe:duration-200 motion-safe:ease-out",
                                )}
                                onClick={() => addReturnLine(product.id)}
                              >
                                <span>{product.name}</span>
                                <span className="text-muted-foreground" dir="ltr">
                                  مخزون {product.quantity}
                                </span>
                              </button>
                            ))
                          })()}
                        </div>
                      </div>

                      <div
                        className="my-3 h-px w-full shrink-0 bg-border md:my-0 md:h-auto md:w-px md:self-stretch"
                        aria-hidden
                      />

                      <div className="flex w-full min-h-[min(20rem,44svh)] flex-none flex-col md:min-h-0 md:flex-1 md:ps-3">
                        <p className="mb-2 shrink-0 text-xs font-semibold text-muted-foreground">
                          المنتجات المضافة للمرتجع
                        </p>
                        <div className="min-h-[min(16rem,38svh)] flex-1 basis-0 space-y-2 overflow-y-auto rounded-md border bg-background p-2 md:min-h-0">
                          {returnLines.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              اختر المنتجات من القائمة اليمنى.
                            </p>
                          ) : (
                            [...returnLines]
                              .sort((a, b) => {
                                const na =
                                  products.find((p) => p.id === a.productId)?.name ?? "\uFFFF"
                                const nb =
                                  products.find((p) => p.id === b.productId)?.name ?? "\uFFFF"
                                return na.localeCompare(nb, localeAr, { sensitivity: "base" })
                              })
                              .map((line) => {
                                const product = products.find((p) => p.id === line.productId)
                                if (!product) {
                                  return null
                                }
                                const unitSell =
                                  priceType === "inside"
                                    ? Number(product.sellPriceInside)
                                    : Number(product.sellPriceOutside)
                                return (
                                  <InvoiceDraftLineRow
                                    key={line.productId}
                                    productName={product.name}
                                    stock={product.quantity}
                                    sellPriceFormatted={formatMoneyAr(unitSell)}
                                    quantity={line.quantity}
                                    maxQuantity={product.quantity}
                                    onQuantityChange={(v) =>
                                      updateReturnLine(line.productId, "quantity", v)
                                    }
                                    onRemove={() => removeReturnLine(line.productId)}
                                  />
                                )
                              })
                          )}
                        </div>
                      </div>
                    </div>

                    {returnLines.length > 0 ? (
                      <div className="mt-3 shrink-0 space-y-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                        <p className="text-xs font-semibold text-muted-foreground">ملخص المرتجع</p>
                        <div className="grid gap-1.5 sm:grid-cols-3">
                          <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                            <span className="text-xs text-muted-foreground">إجمالي البيع</span>
                            <span className="tabular-nums font-semibold text-sky-800" dir="ltr">
                              {formatMoneyAr(returnDraftTotals.totalSell)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                            <span className="text-xs text-muted-foreground">تكلفة الشراء</span>
                            <span className="tabular-nums font-medium text-amber-900" dir="ltr">
                              {formatMoneyAr(returnDraftTotals.totalBuy)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                            <span className="text-xs text-muted-foreground">الربح</span>
                            <span
                              className="tabular-nums font-semibold text-emerald-800"
                              dir="ltr"
                            >
                              {formatMoneyAr(returnDraftTotals.benefit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </PopoverFormBody>
            </form>
          }
          successChild={
            <PopoverFormSuccess title="تم تسجيل المرتجع" description="حُدّث المخزون وفقًا للمرتجع." />
          }
        />
      {loading ? <p className="text-sm text-muted-foreground">جاري تحميل المرتجعات…</p> : null}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>المنتج</TableHead>
              <TableHead>الكمية</TableHead>
              <TableHead>السبب</TableHead>
              <TableHead>إجمالي الاسترداد</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  لا مرتجعات مطابقة للبحث.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="tabular-nums" dir="ltr">
                    {item.quantity.toLocaleString(localeAr)}
                  </TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">{item.reason}</TableCell>
                  <TableCell className="tabular-nums" dir="ltr">
                    {item.totalRefundValue}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        page={returnsPage}
        totalPages={returnsTotalPages}
        total={returnsTotal}
        loading={loading}
        onPageChange={setReturnsPage}
        noun="مرتجع"
      />
    </div>
  )
}
