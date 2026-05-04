import { InvoiceDraftLineRow } from "@/components/InvoiceDraftLineRow"
import {
  PopoverForm,
  PopoverFormBody,
  PopoverFormButton,
  PopoverFormField,
  PopoverFormSuccess,
  popoverFormControlClass,
} from "@/components/PopoverForm"
import { createOutsideInvoice, createProduct, getProducts, updateProduct } from "@/lib/api"
import type { Product } from "@/lib/api"
import { formatMoneyAr, invoiceDraftTotals } from "@/lib/invoice-ui"
import { err, localeAr } from "@/lib/ui-ar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { Pencil } from "lucide-react"
import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"

export function ProductsPage({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [buyPrice, setBuyPrice] = useState("0")
  const [sellPriceInside, setSellPriceInside] = useState("0")
  const [sellPriceOutside, setSellPriceOutside] = useState("0")
  const [quantity, setQuantity] = useState("0")
  const [addOpen, setAddOpen] = useState(false)
  const [addState, setAddState] = useState<"idle" | "loading" | "success">("idle")
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceState, setInvoiceState] = useState<"idle" | "loading" | "success">("idle")
  const [invoiceCustomerName, setInvoiceCustomerName] = useState("")
  const [invoiceAddress, setInvoiceAddress] = useState("")
  const [invoicePhone, setInvoicePhone] = useState("")
  const [invoiceProductSearch, setInvoiceProductSearch] = useState("")
  const [invoiceItems, setInvoiceItems] = useState<Array<{ productId: string; quantity: string }>>([])
  const [editOpenByProduct, setEditOpenByProduct] = useState<Record<string, boolean>>({})
  const [editStateByProduct, setEditStateByProduct] = useState<
    Record<string, "idle" | "loading" | "success">
  >({})
  const [editDraftByProduct, setEditDraftByProduct] = useState<
    Record<
      string,
      {
        name: string
        quantity: string
        buyPrice: string
        sellPriceInside: string
        sellPriceOutside: string
      }
    >
  >({})

  const loadProducts = () => {
    getProducts(token)
      .then(setProducts)
      .catch(() => setError(err.load))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    try {
      setAddState("loading")
      await createProduct(token, {
        name,
        buyPrice: Number(buyPrice),
        sellPriceInside: Number(sellPriceInside),
        sellPriceOutside: Number(sellPriceOutside),
        defaultSellType: "outside",
        quantity: Number(quantity),
      })
      setName("")
      setBuyPrice("0")
      setSellPriceInside("0")
      setSellPriceOutside("0")
      setQuantity("0")
      setLoading(true)
      loadProducts()
      setSuccess("تم إضافة المنتج بنجاح.")
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

  const onCreateOutsideInvoice = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    const customer = invoiceCustomerName.trim()
    const phone = invoicePhone.trim()
    if (!customer) {
      setError("يرجى إدخال اسم العميل.")
      return
    }
    if (!phone) {
      setError("يرجى إدخال رقم الهاتف.")
      return
    }
    if (invoiceItems.length === 0) {
      setError("أضف منتجًا واحدًا على الأقل للفاتورة.")
      return
    }
    for (const line of invoiceItems) {
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
      setInvoiceState("loading")
      await createOutsideInvoice(token, {
        customerName: customer,
        phone,
        address: invoiceAddress.trim() || undefined,
        items: invoiceItems.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
        })),
      })
      setInvoiceCustomerName("")
      setInvoiceAddress("")
      setInvoicePhone("")
      setInvoiceItems([])
      setInvoiceProductSearch("")
      setLoading(true)
      loadProducts()
      setSuccess("تم إنشاء الفاتورة الخارجية بنجاح.")
      setInvoiceState("success")
      setTimeout(() => {
        setInvoiceOpen(false)
        setInvoiceState("idle")
      }, 900)
    } catch {
      setInvoiceState("idle")
      setError(err.create)
    }
  }

  const addInvoiceItem = (productId: string) => {
    setInvoiceItems((prev) => {
      if (prev.some((line) => line.productId === productId)) {
        return prev
      }
      return [...prev, { productId, quantity: "1" }]
    })
  }

  const updateInvoiceItem = (productId: string, key: "quantity", value: string) => {
    setInvoiceItems((prev) =>
      prev.map((line) => (line.productId === productId ? { ...line, [key]: value } : line))
    )
  }

  const removeInvoiceItem = (productId: string) => {
    setInvoiceItems((prev) => prev.filter((line) => line.productId !== productId))
  }

  const onUpdateProduct = async (event: FormEvent, productId: string) => {
    event.preventDefault()
    const draft = editDraftByProduct[productId]
    if (!draft) {
      return
    }
    setError("")
    setSuccess("")
    setEditStateByProduct((prev) => ({ ...prev, [productId]: "loading" }))
    try {
      await updateProduct(token, productId, {
        name: draft.name,
        quantity: Number(draft.quantity),
        buyPrice: Number(draft.buyPrice),
        sellPriceInside: Number(draft.sellPriceInside),
        sellPriceOutside: Number(draft.sellPriceOutside),
      })
      setSuccess("تم تحديث بيانات المنتج بنجاح.")
      setLoading(true)
      loadProducts()
      setEditStateByProduct((prev) => ({ ...prev, [productId]: "success" }))
      setTimeout(() => {
        setEditOpenByProduct((prev) => ({ ...prev, [productId]: false }))
        setEditStateByProduct((prev) => ({ ...prev, [productId]: "idle" }))
      }, 900)
    } catch {
      setEditStateByProduct((prev) => ({ ...prev, [productId]: "idle" }))
      setError(err.request)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  )

  const outsideInvoiceTotals = useMemo(
    () => invoiceDraftTotals(invoiceItems, products, "sellPriceOutside"),
    [invoiceItems, products],
  )

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">المنتجات</h2>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
      <input
        className="w-full max-w-md rounded border bg-transparent px-2 py-1"
        placeholder="بحث في المنتجات…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
          <PopoverForm
            title="إضافة منتج"
            open={addOpen}
            setOpen={setAddOpen}
            width="520px"
            height="280px"
            showCloseButton={addState !== "success"}
            showSuccess={addState === "success"}
            openChild={
              <form className="flex h-full min-h-0 flex-col" onSubmit={onCreate}>
                <PopoverFormBody
                  footer={
                    <div className="flex justify-end">
                      <PopoverFormButton loading={addState === "loading"} text="إنشاء منتج" variant="success" />
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 gap-3">
                    <PopoverFormField label="الاسم" htmlFor="add-product-name">
                      <input
                        id="add-product-name"
                        className={popoverFormControlClass}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </PopoverFormField>
                    <PopoverFormField label="الكمية" htmlFor="add-product-qty">
                      <input
                        id="add-product-qty"
                        className={popoverFormControlClass}
                        type="number"
                        min={0}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </PopoverFormField>
                    <PopoverFormField label="سعر الشراء" htmlFor="add-product-buy">
                      <input
                        id="add-product-buy"
                        className={popoverFormControlClass}
                        type="number"
                        step="0.01"
                        min={0}
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </PopoverFormField>
                    <PopoverFormField label="سعر البيع (داخلي)" htmlFor="add-product-sell-in">
                      <input
                        id="add-product-sell-in"
                        className={popoverFormControlClass}
                        type="number"
                        step="0.01"
                        min={0}
                        value={sellPriceInside}
                        onChange={(e) => setSellPriceInside(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </PopoverFormField>
                    <PopoverFormField label="سعر البيع (خارجي)" htmlFor="add-product-sell-out">
                      <input
                        id="add-product-sell-out"
                        className={popoverFormControlClass}
                        type="number"
                        step="0.01"
                        min={0}
                        value={sellPriceOutside}
                        onChange={(e) => setSellPriceOutside(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </PopoverFormField>
                  </div>
                </PopoverFormBody>
              </form>
            }
            successChild={
              <PopoverFormSuccess
                title="تم إنشاء المنتج"
                description="أُضيف المنتج إلى المخزون."
              />
            }
          />
          <PopoverForm
            title="انشاء فاتورة خارجية"
            open={invoiceOpen}
            setOpen={setInvoiceOpen}
            width="980px"
            height="760px"
            showCloseButton={invoiceState !== "success"}
            showSuccess={invoiceState === "success"}
            openChild={
              <form className="flex h-full min-h-0 flex-col" onSubmit={onCreateOutsideInvoice}>
                <PopoverFormBody
                  footer={
                    <div className="flex justify-end">
                      <PopoverFormButton
                        loading={invoiceState === "loading"}
                        text="انشاء الفاتورة"
                        variant="info"
                      />
                    </div>
                  }
                >
                  <div className="flex h-full min-h-0 flex-col gap-3">
                    <div className="shrink-0 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <PopoverFormField label="اسم العميل" htmlFor="outside-invoice-customer">
                          <input
                            id="outside-invoice-customer"
                            className={popoverFormControlClass}
                            value={invoiceCustomerName}
                            onChange={(e) => setInvoiceCustomerName(e.target.value)}
                            required
                          />
                        </PopoverFormField>
                        <PopoverFormField label="الهاتف" htmlFor="outside-invoice-phone">
                          <input
                            id="outside-invoice-phone"
                            className={popoverFormControlClass}
                            value={invoicePhone}
                            onChange={(e) => setInvoicePhone(e.target.value)}
                            required
                            dir="ltr"
                          />
                        </PopoverFormField>
                        <PopoverFormField
                          label="العنوان (اختياري)"
                          htmlFor="outside-invoice-address"
                          className="sm:col-span-2"
                        >
                          <input
                            id="outside-invoice-address"
                            className={popoverFormControlClass}
                            value={invoiceAddress}
                            onChange={(e) => setInvoiceAddress(e.target.value)}
                          />
                        </PopoverFormField>
                      </div>
                      <PopoverFormField label="بحث عن منتج" htmlFor="outside-invoice-product-search">
                        <input
                          id="outside-invoice-product-search"
                          className={popoverFormControlClass}
                          value={invoiceProductSearch}
                          onChange={(e) => setInvoiceProductSearch(e.target.value)}
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
                              const q = invoiceProductSearch.toLowerCase()
                              const addedIds = new Set(invoiceItems.map((l) => l.productId))
                              const available = products
                                .filter((p) => !addedIds.has(p.id))
                                .filter((p) => p.name.toLowerCase().includes(q))
                                .sort((a, b) =>
                                  a.name.localeCompare(b.name, localeAr, { sensitivity: "base" }),
                                )
                              if (available.length === 0) {
                                return (
                                  <p className="text-xs text-muted-foreground">
                                    {invoiceItems.length === products.length
                                      ? "كل المنتجات مضافة للفاتورة."
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
                                  onClick={() => addInvoiceItem(product.id)}
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
                            المنتجات المضافة للفاتورة
                          </p>
                          <div className="min-h-[min(16rem,38svh)] flex-1 basis-0 space-y-2 overflow-y-auto rounded-md border bg-background p-2 md:min-h-0">
                            {invoiceItems.length === 0 ? (
                              <p className="text-xs text-muted-foreground">اختر المنتجات من القائمة اليمنى.</p>
                            ) : (
                              [...invoiceItems]
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
                                  const unitSell = Number(product.sellPriceOutside)
                                  return (
                                    <InvoiceDraftLineRow
                                      key={line.productId}
                                      productName={product.name}
                                      stock={product.quantity}
                                      sellPriceFormatted={formatMoneyAr(unitSell)}
                                      quantity={line.quantity}
                                      maxQuantity={product.quantity}
                                      onQuantityChange={(v) =>
                                        updateInvoiceItem(line.productId, "quantity", v)
                                      }
                                      onRemove={() => removeInvoiceItem(line.productId)}
                                    />
                                  )
                                })
                            )}
                          </div>
                        </div>
                      </div>

                      {invoiceItems.length > 0 ? (
                        <div className="mt-3 shrink-0 space-y-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                          <p className="text-xs font-semibold text-muted-foreground">ملخص الفاتورة</p>
                          <div className="grid gap-1.5 sm:grid-cols-3">
                            <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                              <span className="text-xs text-muted-foreground">إجمالي البيع</span>
                              <span className="tabular-nums font-semibold text-sky-800" dir="ltr">
                                {formatMoneyAr(outsideInvoiceTotals.totalSell)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                              <span className="text-xs text-muted-foreground">تكلفة الشراء</span>
                              <span className="tabular-nums font-medium text-amber-900" dir="ltr">
                                {formatMoneyAr(outsideInvoiceTotals.totalBuy)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                              <span className="text-xs text-muted-foreground">الربح</span>
                              <span
                                className="tabular-nums font-semibold text-emerald-800"
                                dir="ltr"
                              >
                                {formatMoneyAr(outsideInvoiceTotals.benefit)}
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
              <PopoverFormSuccess
                title="تم إنشاء الفاتورة الخارجية"
                description="تم تسجيل الفاتورة وتحديث المخزون."
              />
            }
          />
        </div>
      {loading ? <p className="text-sm text-muted-foreground">جاري تحميل المنتجات…</p> : null}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>الاسم</TableHead>
              <TableHead>الكمية</TableHead>
              <TableHead>الشراء</TableHead>
              <TableHead>البيع (داخل)</TableHead>
              <TableHead>البيع (خارج)</TableHead>
              <TableHead>تعديل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  لا توجد منتجات مطابقة للبحث.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="tabular-nums" dir="ltr">
                    {product.quantity.toLocaleString(localeAr)}
                  </TableCell>
                  <TableCell className="tabular-nums" dir="ltr">
                    {product.buyPrice}
                  </TableCell>
                  <TableCell className="tabular-nums" dir="ltr">
                    {product.sellPriceInside}
                  </TableCell>
                  <TableCell className="tabular-nums" dir="ltr">
                    {product.sellPriceOutside}
                  </TableCell>
                  <TableCell>
                      <PopoverForm
                        title={`تعديل ${product.name}`}
                        open={editOpenByProduct[product.id] ?? false}
                        setOpen={(value) => {
                          setEditOpenByProduct((prev) => ({ ...prev, [product.id]: value }))
                          if (value && !editDraftByProduct[product.id]) {
                            setEditDraftByProduct((prev) => ({
                              ...prev,
                              [product.id]: {
                                name: product.name,
                                quantity: String(product.quantity),
                                buyPrice: String(product.buyPrice),
                                sellPriceInside: String(product.sellPriceInside),
                                sellPriceOutside: String(product.sellPriceOutside),
                              },
                            }))
                          }
                        }}
                        width="520px"
                        height="280px"
                        showCloseButton={editStateByProduct[product.id] !== "success"}
                        showSuccess={editStateByProduct[product.id] === "success"}
                        triggerClassName="h-8 w-8 justify-center p-0"
                        triggerChild={<Pencil className="size-4" />}
                        openChild={
                          <form
                            className="flex h-full min-h-0 flex-col"
                            onSubmit={(e) => onUpdateProduct(e, product.id)}
                          >
                            <PopoverFormBody
                              footer={
                                <div className="flex justify-end">
                                  <PopoverFormButton
                                    loading={editStateByProduct[product.id] === "loading"}
                                    text="حفظ التعديلات"
                                    variant="violet"
                                  />
                                </div>
                              }
                            >
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <PopoverFormField label="الاسم" htmlFor={`edit-product-name-${product.id}`}>
                                  <input
                                    id={`edit-product-name-${product.id}`}
                                    className={popoverFormControlClass}
                                    value={editDraftByProduct[product.id]?.name ?? ""}
                                    onChange={(e) =>
                                      setEditDraftByProduct((prev) => ({
                                        ...prev,
                                        [product.id]: {
                                          ...(prev[product.id] ?? {
                                            name: product.name,
                                            quantity: String(product.quantity),
                                            buyPrice: String(product.buyPrice),
                                            sellPriceInside: String(product.sellPriceInside),
                                            sellPriceOutside: String(product.sellPriceOutside),
                                          }),
                                          name: e.target.value,
                                        },
                                      }))
                                    }
                                    required
                                  />
                                </PopoverFormField>
                                <PopoverFormField label="الكمية" htmlFor={`edit-product-qty-${product.id}`}>
                                  <input
                                    id={`edit-product-qty-${product.id}`}
                                    className={popoverFormControlClass}
                                    type="number"
                                    min={0}
                                    value={editDraftByProduct[product.id]?.quantity ?? ""}
                                    onChange={(e) =>
                                      setEditDraftByProduct((prev) => ({
                                        ...prev,
                                        [product.id]: {
                                          ...(prev[product.id] ?? {
                                            name: product.name,
                                            quantity: String(product.quantity),
                                            buyPrice: String(product.buyPrice),
                                            sellPriceInside: String(product.sellPriceInside),
                                            sellPriceOutside: String(product.sellPriceOutside),
                                          }),
                                          quantity: e.target.value,
                                        },
                                      }))
                                    }
                                    required
                                    dir="ltr"
                                  />
                                </PopoverFormField>
                                <PopoverFormField label="سعر الشراء" htmlFor={`edit-product-buy-${product.id}`}>
                                  <input
                                    id={`edit-product-buy-${product.id}`}
                                    className={popoverFormControlClass}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editDraftByProduct[product.id]?.buyPrice ?? ""}
                                    onChange={(e) =>
                                      setEditDraftByProduct((prev) => ({
                                        ...prev,
                                        [product.id]: {
                                          ...(prev[product.id] ?? {
                                            name: product.name,
                                            quantity: String(product.quantity),
                                            buyPrice: String(product.buyPrice),
                                            sellPriceInside: String(product.sellPriceInside),
                                            sellPriceOutside: String(product.sellPriceOutside),
                                          }),
                                          buyPrice: e.target.value,
                                        },
                                      }))
                                    }
                                    required
                                    dir="ltr"
                                  />
                                </PopoverFormField>
                                <PopoverFormField label="سعر البيع (داخل)" htmlFor={`edit-product-inside-${product.id}`}>
                                  <input
                                    id={`edit-product-inside-${product.id}`}
                                    className={popoverFormControlClass}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editDraftByProduct[product.id]?.sellPriceInside ?? ""}
                                    onChange={(e) =>
                                      setEditDraftByProduct((prev) => ({
                                        ...prev,
                                        [product.id]: {
                                          ...(prev[product.id] ?? {
                                            name: product.name,
                                            quantity: String(product.quantity),
                                            buyPrice: String(product.buyPrice),
                                            sellPriceInside: String(product.sellPriceInside),
                                            sellPriceOutside: String(product.sellPriceOutside),
                                          }),
                                          sellPriceInside: e.target.value,
                                        },
                                      }))
                                    }
                                    required
                                    dir="ltr"
                                  />
                                </PopoverFormField>
                                <PopoverFormField label="سعر البيع (خارج)" htmlFor={`edit-product-outside-${product.id}`} className="sm:col-span-2">
                                  <input
                                    id={`edit-product-outside-${product.id}`}
                                    className={popoverFormControlClass}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editDraftByProduct[product.id]?.sellPriceOutside ?? ""}
                                    onChange={(e) =>
                                      setEditDraftByProduct((prev) => ({
                                        ...prev,
                                        [product.id]: {
                                          ...(prev[product.id] ?? {
                                            name: product.name,
                                            quantity: String(product.quantity),
                                            buyPrice: String(product.buyPrice),
                                            sellPriceInside: String(product.sellPriceInside),
                                            sellPriceOutside: String(product.sellPriceOutside),
                                          }),
                                          sellPriceOutside: e.target.value,
                                        },
                                      }))
                                    }
                                    required
                                    dir="ltr"
                                  />
                                </PopoverFormField>
                              </div>
                            </PopoverFormBody>
                          </form>
                        }
                        successChild={
                          <PopoverFormSuccess
                            title="تم تحديث المنتج"
                            description="حُفظت التعديلات بنجاح."
                          />
                        }
                      />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
