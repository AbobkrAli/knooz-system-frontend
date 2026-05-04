import { InvoiceDraftLineRow } from "@/components/InvoiceDraftLineRow"
import {
  PopoverForm,
  PopoverFormBody,
  PopoverFormButton,
  PopoverFormField,
  PopoverFormSuccess,
  popoverFormControlClass,
} from "@/components/PopoverForm"
import {
  createInventoryTransaction,
  createSellingTransaction,
  createVisit,
  getInventoryTransactions,
  getProducts,
  getSellingTransactions,
  getVisits,
  getWorkGroups,
  updateVisitStatus,
  updateVisitWorkGroup,
} from "@/lib/api"
import type {
  InventoryTransaction,
  InvoiceHistoryEntry,
  Product,
  SellingTransaction,
  Visit,
  WorkGroup,
} from "@/lib/api"
import { formatMoneyAr, invoiceDraftTotals } from "@/lib/invoice-ui"
import {
  exportInvoiceReceiptPdf,
  exportInvoiceReceiptPng,
  printInvoiceReceipt,
} from "@/lib/invoice-receipt-export"
import { err, localeAr, sellTypeAr, sellingTypeAr } from "@/lib/ui-ar"
import { PaginationBar } from "@/components/PaginationBar"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDown, ChevronRight, Eye, FileImage, FileText, Printer } from "lucide-react"
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
import { Fragment, useCallback, useEffect, useRef, useState } from "react"

const VISITS_PAGE_SIZE = 20
/** «الشغل الحالي»: fetch fewer visits per request. */
const CURRENT_WORK_PAGE_SIZE = 6

function inventoryTxToInvoiceEntry(
  visit: Visit,
  tx: InventoryTransaction,
  products: Product[],
): InvoiceHistoryEntry {
  const items = (tx.items ?? []).map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    unitSellPrice: item.unitSellPrice,
    unitBuyPrice: item.unitBuyPrice,
    lineSellTotal: item.lineSellTotal,
    lineBuyTotal: item.lineBuyTotal,
    lineBenefit: item.lineBenefit,
    product: {
      id: item.productId,
      name: products.find((p) => p.id === item.productId)?.name ?? "منتج غير معروف",
    },
  }))
  return {
    id: tx.id,
    type: tx.type,
    totalSell: tx.totalSell,
    totalBuyCost: tx.totalBuyCost,
    benefit: tx.benefit,
    createdAt: tx.createdAt ?? visit.visitDate,
    visit: {
      id: visit.id,
      customerName: visit.customerName,
      address: visit.address,
      phone: visit.phone,
      workGroup: visit.workGroup ?? null,
    },
    items,
  }
}

type VisitStatus = "done" | "pending" | "fail"
type InventoryLineDraft = { productId: string; quantity: string }
type InventoryFormState = {
  type: "inside" | "outside"
  items: InventoryLineDraft[]
  productSearch: string
}

function VisitStatusSelect({
  id,
  value,
  disabled,
  onChange,
}: {
  id?: string
  value: VisitStatus
  disabled?: boolean
  onChange: (status: VisitStatus) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as VisitStatus)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className="mx-auto w-full min-w-0 max-w-56 sm:min-w-36"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">قيد الانتظار</SelectItem>
        <SelectItem value="done">منجز</SelectItem>
        <SelectItem value="fail">فاشل</SelectItem>
      </SelectContent>
    </Select>
  )
}

export type VisitsPageVariant = "current-work" | "all-visits"

export function VisitsPage({
  token,
  variant,
}: {
  token: string
  variant: VisitsPageVariant
}) {
  const isCurrentWork = variant === "current-work"

  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sellingByVisit, setSellingByVisit] = useState<Record<string, SellingTransaction[]>>(
    {}
  )
  const [inventoryByVisit, setInventoryByVisit] = useState<
    Record<string, InventoryTransaction[]>
  >({})
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [visitsPage, setVisitsPage] = useState(1)
  const [visitsTotal, setVisitsTotal] = useState(0)
  const [visitsTotalPages, setVisitsTotalPages] = useState(0)
  const visitsSearchDebounceReady = useRef(false)
  const [customerName, setCustomerName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [visitDate, setVisitDate] = useState("")
  const [workType, setWorkType] = useState<"board" | "epoxy">("board")
  const [workGroupId, setWorkGroupId] = useState("")
  const [sellingFormByVisit, setSellingFormByVisit] = useState<
    Record<string, { money: string; type: "pay" | "get"; reason: string }>
  >({})
  const [inventoryFormByVisit, setInventoryFormByVisit] = useState<
    Record<string, InventoryFormState>
  >({})
  const [visitAddOpen, setVisitAddOpen] = useState(false)
  const [visitAddState, setVisitAddState] = useState<"idle" | "loading" | "success">("idle")
  const [sellingOpenByVisit, setSellingOpenByVisit] = useState<Record<string, boolean>>({})
  const [inventoryOpenByVisit, setInventoryOpenByVisit] = useState<Record<string, boolean>>({})
  const [expandedByVisit, setExpandedByVisit] = useState<Record<string, boolean>>({})
  const [sellingDetailOpenByTx, setSellingDetailOpenByTx] = useState<Record<string, boolean>>({})
  const [inventoryDetailOpenByTx, setInventoryDetailOpenByTx] = useState<Record<string, boolean>>({})
  const [inventoryReceiptBusy, setInventoryReceiptBusy] = useState<{
    id: string
    kind: "png" | "pdf" | "print"
  } | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [workGroupUpdatingId, setWorkGroupUpdatingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | VisitStatus>("pending")
  const [currentWorkGroupFilter, setCurrentWorkGroupFilter] = useState<string>("all")

  const loadVisits = useCallback(() => {
    setLoading(true)
    getVisits(token, {
      page: visitsPage,
      limit: isCurrentWork ? CURRENT_WORK_PAGE_SIZE : VISITS_PAGE_SIZE,
      q: search.trim() || undefined,
      status: isCurrentWork ? "done" : statusFilter,
      workGroupId:
        isCurrentWork && currentWorkGroupFilter !== "all"
          ? currentWorkGroupFilter
          : undefined,
    })
      .then((res) => {
        setVisits(res.data)
        setVisitsTotal(res.total)
        setVisitsTotalPages(res.totalPages)
      })
      .catch(() => setError(err.load))
      .finally(() => setLoading(false))
  }, [
    token,
    visitsPage,
    isCurrentWork,
    statusFilter,
    currentWorkGroupFilter,
    search,
  ])

  const loadVisitTransactions = (visitId: string) => {
    Promise.all([
      getSellingTransactions(token, visitId),
      getInventoryTransactions(token, visitId),
    ])
      .then(([selling, inventory]) => {
        setSellingByVisit((prev) => ({ ...prev, [visitId]: selling }))
        setInventoryByVisit((prev) => ({ ...prev, [visitId]: inventory }))
      })
      .catch(() => setError(err.load))
  }

  async function runInventoryReceiptExport(
    visit: Visit,
    tx: InventoryTransaction,
    kind: "png" | "pdf" | "print",
  ) {
    if (inventoryReceiptBusy) return
    setInventoryReceiptBusy({ id: tx.id, kind })
    try {
      const invoice = inventoryTxToInvoiceEntry(visit, tx, products)
      if (kind === "png") await exportInvoiceReceiptPng(invoice)
      else if (kind === "pdf") await exportInvoiceReceiptPdf(invoice)
      else await printInvoiceReceipt(invoice)
    } catch {
      /* canvas / popup */
    } finally {
      setInventoryReceiptBusy(null)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      if (!visitsSearchDebounceReady.current) {
        visitsSearchDebounceReady.current = true
        setSearch(next)
        return
      }
      setSearch(next)
      setVisitsPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch paginated visits when filters/page change
    loadVisits()
  }, [loadVisits])

  useEffect(() => {
    getProducts(token)
      .then((loadedProducts) => {
        setProducts(loadedProducts)
      })
      .catch(() => setError(err.load))
    getWorkGroups(token)
      .then((groups) => {
        setWorkGroups(groups)
        if (!workGroupId && groups[0]) {
          setWorkGroupId(groups[0].id)
        }
      })
      .catch(() => setError(err.load))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (!isCurrentWork) {
      return
    }
    visits
      .filter((v) => v.status === "done")
      .forEach((visit) => {
        loadVisitTransactions(visit.id)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, isCurrentWork])

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    try {
      setVisitAddState("loading")
      await createVisit(token, {
        customerName,
        address,
        phone,
        visitDate: new Date(visitDate).toISOString(),
        workType,
        workGroupId,
      })
      setCustomerName("")
      setAddress("")
      setPhone("")
      setVisitDate("")
      setLoading(true)
      loadVisits()
      setVisitAddState("success")
      setTimeout(() => {
        setVisitAddOpen(false)
        setVisitAddState("idle")
      }, 900)
    } catch {
      setVisitAddState("idle")
      setError(err.create)
    }
  }

  const onUpdateStatus = async (visitId: string, status: VisitStatus) => {
    setError("")
    setStatusUpdatingId(visitId)
    try {
      await updateVisitStatus(token, visitId, status)
      setLoading(true)
      loadVisits()
    } catch {
      setError(err.status)
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const onCreateSellingTx = async (event: FormEvent, visitId: string) => {
    event.preventDefault()
    setError("")
    const form = sellingFormByVisit[visitId] ?? { money: "0", type: "get", reason: "" }
    try {
      await createSellingTransaction(token, visitId, {
        money: Number(form.money),
        type: form.type,
        date: new Date().toISOString(),
        reason: form.reason,
      })
      setSellingFormByVisit((prev) => ({
        ...prev,
        [visitId]: { money: "0", type: "get", reason: "" },
      }))
      setSellingOpenByVisit((prev) => ({ ...prev, [visitId]: false }))
      loadVisitTransactions(visitId)
    } catch {
      setError(err.selling)
    }
  }

  const onUpdateWorkGroup = async (visitId: string, nextWorkGroupId: string) => {
    setError("")
    setWorkGroupUpdatingId(visitId)
    try {
      await updateVisitWorkGroup(token, visitId, nextWorkGroupId)
      setLoading(true)
      loadVisits()
    } catch {
      setError(err.request)
    } finally {
      setWorkGroupUpdatingId(null)
    }
  }

  const onCreateInventoryTx = async (event: FormEvent, visitId: string) => {
    event.preventDefault()
    setError("")
    const form = inventoryFormByVisit[visitId] ?? { type: "inside", items: [], productSearch: "" }
    if (form.items.length === 0) {
      setError("أضف منتجًا واحدًا على الأقل للفاتورة.")
      return
    }
    for (const line of form.items) {
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
      await createInventoryTransaction(token, visitId, {
        type: "inside",
        items: form.items.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
        })),
      })
      setInventoryFormByVisit((prev) => ({
        ...prev,
        [visitId]: { type: "inside", items: [], productSearch: "" },
      }))
      setInventoryOpenByVisit((prev) => ({ ...prev, [visitId]: false }))
      loadVisitTransactions(visitId)
      getProducts(token).then(setProducts)
    } catch {
      setError(err.inventory)
    }
  }

  const setInventorySearch = (visitId: string, productSearch: string) => {
    setInventoryFormByVisit((prev) => ({
      ...prev,
      [visitId]: {
        type: prev[visitId]?.type ?? "inside",
        items: prev[visitId]?.items ?? [],
        productSearch,
      },
    }))
  }

  const addInventoryItem = (visitId: string, productId: string) => {
    setInventoryFormByVisit((prev) => {
      const form = prev[visitId] ?? { type: "inside" as const, items: [], productSearch: "" }
      if (form.items.some((item) => item.productId === productId)) {
        return prev
      }
      return {
        ...prev,
        [visitId]: {
          ...form,
          items: [...form.items, { productId, quantity: "1" }],
        },
      }
    })
  }

  const setInventoryItemQuantity = (visitId: string, productId: string, quantity: string) => {
    setInventoryFormByVisit((prev) => {
      const form = prev[visitId] ?? { type: "inside" as const, items: [], productSearch: "" }
      return {
        ...prev,
        [visitId]: {
          ...form,
          items: form.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        },
      }
    })
  }

  const removeInventoryItem = (visitId: string, productId: string) => {
    setInventoryFormByVisit((prev) => {
      const form = prev[visitId] ?? { type: "inside" as const, items: [], productSearch: "" }
      return {
        ...prev,
        [visitId]: {
          ...form,
          items: form.items.filter((item) => item.productId !== productId),
        },
      }
    })
  }

  const pageTitle = isCurrentWork ? "الشغل الحالي" : "المعاينات"
  const searchPlaceholder = isCurrentWork ? "بحث في الشغل الحالي…" : "بحث في المعاينات…"
  const emptyMessage = isCurrentWork
    ? "لا زيارات منجزة مطابقة للبحث."
    : "لا زيارات مطابقة للبحث."

  const colCount = isCurrentWork ? 7 : 5

  return (
    <div className={cn("space-y-2", isCurrentWork && "space-y-3")}>
      <h2 className="text-xl font-semibold">{pageTitle}</h2>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <input
            className="w-full rounded border bg-transparent px-2 py-1.5 text-sm sm:py-1"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={searchPlaceholder}
          />
        </div>
        {!isCurrentWork ? (
          <div className="w-full min-w-0 sm:w-auto sm:max-w-xs">
            <p className="mb-1 text-xs text-muted-foreground">فلترة الحالة</p>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as "all" | VisitStatus)
                setVisitsPage(1)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">قيد الانتظار فقط</SelectItem>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="done">المنجزة فقط</SelectItem>
                <SelectItem value="fail">الفاشلة فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {isCurrentWork ? (
          <div className="w-full min-w-0 sm:w-auto sm:max-w-xs">
            <p className="mb-1 text-xs text-muted-foreground">فلترة مجموعة العمل</p>
            <Select
            value={currentWorkGroupFilter}
            onValueChange={(v) => {
              setCurrentWorkGroupFilter(v)
              setVisitsPage(1)
            }}
          >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المجموعات</SelectItem>
                {workGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      {!isCurrentWork ? (
        <PopoverForm
          title="إضافة زيارة"
          open={visitAddOpen}
          setOpen={setVisitAddOpen}
          width="560px"
          height="280px"
          showCloseButton={visitAddState !== "success"}
          showSuccess={visitAddState === "success"}
          openChild={
            <form className="flex h-full min-h-0 flex-col" onSubmit={onCreate}>
              <PopoverFormBody
                footer={
                  <div className="flex justify-end">
                    <PopoverFormButton loading={visitAddState === "loading"} text="إنشاء زيارة" />
                  </div>
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <PopoverFormField label="اسم العميل" htmlFor="add-visit-customer-all">
                    <input
                      id="add-visit-customer-all"
                      className={popoverFormControlClass}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </PopoverFormField>
                  <PopoverFormField label="الهاتف" htmlFor="add-visit-phone-all">
                    <input
                      id="add-visit-phone-all"
                      className={popoverFormControlClass}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      dir="ltr"
                    />
                  </PopoverFormField>
                  <PopoverFormField label="العنوان" htmlFor="add-visit-address-all" className="col-span-2">
                    <input
                      id="add-visit-address-all"
                      className={popoverFormControlClass}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </PopoverFormField>
                  <PopoverFormField label="تاريخ ووقت الزيارة" htmlFor="add-visit-date-all">
                    <input
                      id="add-visit-date-all"
                      className={popoverFormControlClass}
                      type="datetime-local"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      required
                      dir="ltr"
                    />
                  </PopoverFormField>
                  <PopoverFormField label="نوع العمل" htmlFor="add-visit-work-type-all">
                    <Select
                      value={workType}
                      onValueChange={(v) => setWorkType(v as "board" | "epoxy")}
                    >
                      <SelectTrigger id="add-visit-work-type-all" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="board">جبس بورد</SelectItem>
                        <SelectItem value="epoxy">إيبوكسي</SelectItem>
                      </SelectContent>
                    </Select>
                  </PopoverFormField>
                  <PopoverFormField label="مجموعة العمل" htmlFor="add-visit-work-group-all">
                    <Select value={workGroupId} onValueChange={setWorkGroupId}>
                      <SelectTrigger id="add-visit-work-group-all" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {workGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PopoverFormField>
                </div>
              </PopoverFormBody>
            </form>
          }
          successChild={
            <PopoverFormSuccess title="تم إنشاء الزيارة" description="سُجّلت الزيارة بنجاح." />
          }
        />
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">
          {isCurrentWork ? "جاري تحميل الشغل الحالي…" : "جاري تحميل المعاينات…"}
        </p>
      ) : null}
      <div
        className={cn(
          "min-w-0 rounded-lg border border-border bg-card",
          isCurrentWork && "-mx-1 overflow-x-auto overscroll-x-contain sm:mx-0",
        )}
      >
        <Table
          className={cn(
            "w-full",
            isCurrentWork && "min-w-[52rem] md:min-w-[56rem] lg:min-w-0",
          )}
        >
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {isCurrentWork ? <TableHead className="w-10" /> : null}
              <TableHead className="whitespace-nowrap">العميل</TableHead>
              <TableHead className="whitespace-nowrap">الهاتف</TableHead>
              <TableHead className="min-w-[8rem]">العنوان</TableHead>
              {isCurrentWork ? (
                <TableHead className="whitespace-nowrap">مجموعة العمل</TableHead>
              ) : null}
              {!isCurrentWork ? <TableHead className="whitespace-nowrap">الحالة</TableHead> : null}
              <TableHead className="whitespace-nowrap">تاريخ الزيارة</TableHead>
              {isCurrentWork ? (
                <TableHead className="min-w-[12rem] whitespace-nowrap sm:min-w-[14rem]">
                  إجراءات
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : isCurrentWork ? (
              visits.map((visit) => (
                <Fragment key={visit.id}>
                  <TableRow className="border-b-0 bg-background">
                    <TableCell className="align-middle">
                      <button
                        type="button"
                        className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-expanded={Boolean(expandedByVisit[visit.id])}
                        aria-label={
                          expandedByVisit[visit.id]
                            ? "إخفاء تفاصيل الزيارة"
                            : "عرض تفاصيل الزيارة"
                        }
                        onClick={() =>
                          setExpandedByVisit((prev) => ({
                            ...prev,
                            [visit.id]: !(prev[visit.id] ?? false),
                          }))
                        }
                      >
                        {expandedByVisit[visit.id] ? (
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
                    <TableCell
                      className="max-w-[9rem] truncate font-medium sm:max-w-none sm:whitespace-normal"
                      title={visit.customerName}
                    >
                      {visit.customerName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums" dir="ltr">
                      {visit.phone}
                    </TableCell>
                    <TableCell
                      className="max-w-[10rem] truncate text-muted-foreground sm:max-w-[14rem] sm:whitespace-normal"
                      title={visit.address || undefined}
                    >
                      {visit.address}
                    </TableCell>
                    <TableCell className="align-top">
                      <Select
                        value={visit.workGroupId ?? "__none__"}
                        onValueChange={(v) => {
                          if (v === "__none__") return
                          void onUpdateWorkGroup(visit.id, v)
                        }}
                        disabled={workGroupUpdatingId === visit.id}
                      >
                        <SelectTrigger
                          id={`visit-work-group-${visit.id}`}
                          className="mx-auto w-full min-w-0 max-w-56 sm:min-w-36"
                        >
                          <SelectValue placeholder="بدون مجموعة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" disabled>
                            بدون مجموعة
                          </SelectItem>
                          {workGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground sm:text-sm">
                      {new Date(visit.visitDate).toLocaleString(localeAr)}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                        <PopoverForm
                          title="معاملة مالية"
                          open={sellingOpenByVisit[visit.id] ?? false}
                          setOpen={(value) =>
                            setSellingOpenByVisit((prev) => ({ ...prev, [visit.id]: value }))
                          }
                          width="420px"
                          height="240px"
                          showCloseButton
                          showSuccess={false}
                          wrapperClassName="flex w-full sm:inline-flex sm:w-auto"
                          triggerClassName="w-full justify-center sm:w-auto"
                          openChild={
                            <form
                              className="flex h-full min-h-0 flex-col"
                              onSubmit={(e) => onCreateSellingTx(e, visit.id)}
                            >
                              <PopoverFormBody
                                footer={
                                  <div className="flex justify-end">
                                    <PopoverFormButton loading={false} text="تسجيل المعاملة" />
                                  </div>
                                }
                              >
                                <div className="space-y-3">
                                  <PopoverFormField label="المبلغ" htmlFor={`selling-money-${visit.id}`}>
                                    <input
                                      id={`selling-money-${visit.id}`}
                                      className={popoverFormControlClass}
                                      type="number"
                                      min={0.01}
                                      step="0.01"
                                      value={sellingFormByVisit[visit.id]?.money ?? "0"}
                                      onChange={(e) =>
                                        setSellingFormByVisit((prev) => ({
                                          ...prev,
                                          [visit.id]: {
                                            money: e.target.value,
                                            type: prev[visit.id]?.type ?? "get",
                                            reason: prev[visit.id]?.reason ?? "",
                                          },
                                        }))
                                      }
                                      required
                                      dir="ltr"
                                    />
                                  </PopoverFormField>
                                  <PopoverFormField label="النوع" htmlFor={`selling-type-${visit.id}`}>
                                    <Select
                                      value={sellingFormByVisit[visit.id]?.type ?? "get"}
                                      onValueChange={(v) =>
                                        setSellingFormByVisit((prev) => ({
                                          ...prev,
                                          [visit.id]: {
                                            money: prev[visit.id]?.money ?? "0",
                                            type: v as "pay" | "get",
                                            reason: prev[visit.id]?.reason ?? "",
                                          },
                                        }))
                                      }
                                    >
                                      <SelectTrigger
                                        id={`selling-type-${visit.id}`}
                                        className="w-full"
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="get">استلام</SelectItem>
                                        <SelectItem value="pay">دفع</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </PopoverFormField>
                                  <PopoverFormField label="السبب" htmlFor={`selling-reason-${visit.id}`}>
                                    <input
                                      id={`selling-reason-${visit.id}`}
                                      className={popoverFormControlClass}
                                      value={sellingFormByVisit[visit.id]?.reason ?? ""}
                                      onChange={(e) =>
                                        setSellingFormByVisit((prev) => ({
                                          ...prev,
                                          [visit.id]: {
                                            money: prev[visit.id]?.money ?? "0",
                                            type: prev[visit.id]?.type ?? "get",
                                            reason: e.target.value,
                                          },
                                        }))
                                      }
                                      required
                                    />
                                  </PopoverFormField>
                                </div>
                              </PopoverFormBody>
                            </form>
                          }
                        />

                        <PopoverForm
                          title="انشاء فاتورة داخلية"
                          open={inventoryOpenByVisit[visit.id] ?? false}
                          setOpen={(value) =>
                            setInventoryOpenByVisit((prev) => ({ ...prev, [visit.id]: value }))
                          }
                          width="980px"
                          height="760px"
                          showCloseButton
                          showSuccess={false}
                          wrapperClassName="flex w-full sm:inline-flex sm:w-auto"
                          triggerClassName="w-full justify-center sm:w-auto"
                          openChild={
                            <form
                              className="flex h-full min-h-0 flex-col"
                              onSubmit={(e) => onCreateInventoryTx(e, visit.id)}
                            >
                              <PopoverFormBody
                                footer={
                                  <div className="flex justify-end">
                                    <PopoverFormButton loading={false} text="تسجيل المخزون" />
                                  </div>
                                }
                              >
                                <div className="flex h-full min-h-0 flex-col gap-3">
                                  {(() => {
                                    const invForm = inventoryFormByVisit[visit.id] ?? {
                                      type: "inside" as const,
                                      items: [],
                                      productSearch: "",
                                    }
                                    const insideInvoiceTotals = invoiceDraftTotals(
                                      invForm.items,
                                      products,
                                      "sellPriceInside",
                                    )
                                    return (
                                      <>
                                        <div className="shrink-0 space-y-3">
                                          <p className="text-xs text-muted-foreground">
                                            فاتورة داخلية — تُحسب بأسعار البيع الداخلية وتُسجّل كحركة
                                            مخزون مرتبطة بالمعاينة.
                                          </p>
                                          <PopoverFormField
                                            label="بحث عن منتج"
                                            htmlFor={`inv-search-${visit.id}`}
                                          >
                                            <input
                                              id={`inv-search-${visit.id}`}
                                              className={popoverFormControlClass}
                                              value={invForm.productSearch}
                                              onChange={(e) =>
                                                setInventorySearch(visit.id, e.target.value)
                                              }
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
                                                  const q = invForm.productSearch.toLowerCase()
                                                  const addedIds = new Set(
                                                    invForm.items.map((l) => l.productId),
                                                  )
                                                  const available = products
                                                    .filter((p) => !addedIds.has(p.id))
                                                    .filter((p) => p.name.toLowerCase().includes(q))
                                                    .sort((a, b) =>
                                                      a.name.localeCompare(b.name, localeAr, {
                                                        sensitivity: "base",
                                                      }),
                                                    )
                                                  if (available.length === 0) {
                                                    return (
                                                      <p className="text-xs text-muted-foreground">
                                                        {invForm.items.length === products.length
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
                                                      onClick={() =>
                                                        addInventoryItem(visit.id, product.id)
                                                      }
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
                                                {invForm.items.length === 0 ? (
                                                  <p className="text-xs text-muted-foreground">
                                                    اختر المنتجات من القائمة اليمنى.
                                                  </p>
                                                ) : (
                                                  [...invForm.items]
                                                    .sort((a, b) => {
                                                      const na =
                                                        products.find((p) => p.id === a.productId)
                                                          ?.name ?? "\uFFFF"
                                                      const nb =
                                                        products.find((p) => p.id === b.productId)
                                                          ?.name ?? "\uFFFF"
                                                      return na.localeCompare(nb, localeAr, {
                                                        sensitivity: "base",
                                                      })
                                                    })
                                                    .map((line) => {
                                                      const product = products.find(
                                                        (p) => p.id === line.productId,
                                                      )
                                                      if (!product) {
                                                        return null
                                                      }
                                                      const unitSell = Number(product.sellPriceInside)
                                                      return (
                                                        <InvoiceDraftLineRow
                                                          key={line.productId}
                                                          productName={product.name}
                                                          stock={product.quantity}
                                                          sellPriceFormatted={formatMoneyAr(unitSell)}
                                                          quantity={line.quantity}
                                                          maxQuantity={product.quantity}
                                                          onQuantityChange={(v) =>
                                                            setInventoryItemQuantity(
                                                              visit.id,
                                                              line.productId,
                                                              v,
                                                            )
                                                          }
                                                          onRemove={() =>
                                                            removeInventoryItem(
                                                              visit.id,
                                                              line.productId,
                                                            )
                                                          }
                                                        />
                                                      )
                                                    })
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          {invForm.items.length > 0 ? (
                                            <div className="mt-3 shrink-0 space-y-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                                              <p className="text-xs font-semibold text-muted-foreground">
                                                ملخص الفاتورة
                                              </p>
                                              <div className="grid gap-1.5 sm:grid-cols-3">
                                                <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                                                  <span className="text-xs text-muted-foreground">
                                                    إجمالي البيع
                                                  </span>
                                                  <span
                                                    className="tabular-nums font-semibold text-sky-800"
                                                    dir="ltr"
                                                  >
                                                    {formatMoneyAr(insideInvoiceTotals.totalSell)}
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                                                  <span className="text-xs text-muted-foreground">
                                                    تكلفة الشراء
                                                  </span>
                                                  <span
                                                    className="tabular-nums font-medium text-amber-900"
                                                    dir="ltr"
                                                  >
                                                    {formatMoneyAr(insideInvoiceTotals.totalBuy)}
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 sm:flex-col sm:items-stretch sm:justify-center">
                                                  <span className="text-xs text-muted-foreground">
                                                    الربح
                                                  </span>
                                                  <span
                                                    className="tabular-nums font-semibold text-emerald-800"
                                                    dir="ltr"
                                                  >
                                                    {formatMoneyAr(insideInvoiceTotals.benefit)}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>
                              </PopoverFormBody>
                            </form>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="border-b p-0 align-middle">
                      <div
                        className={cn(
                          "grid overflow-hidden motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-out",
                          expandedByVisit[visit.id] ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="min-h-0">
                          <div
                            className="bg-muted/20 px-1.5 pb-3 pt-2 sm:px-2"
                            aria-hidden={!expandedByVisit[visit.id]}
                          >
                        <div className="grid min-w-0 gap-4 md:grid-cols-2">
                        <div className="min-w-0 space-y-2">
                          <p className="text-center text-xs font-semibold text-muted-foreground">
                            المعاملات المالية
                          </p>
                          <div className="overflow-x-auto rounded-md border bg-background">
                            <Table className="w-full min-w-[28rem] text-xs md:min-w-0">
                              <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                  <TableHead>النوع</TableHead>
                                  <TableHead>المبلغ</TableHead>
                                  <TableHead>السبب</TableHead>
                                  <TableHead>التاريخ</TableHead>
                                  <TableHead>عرض</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(sellingByVisit[visit.id] ?? []).length === 0 ? (
                                  <TableRow className="hover:bg-transparent">
                                    <TableCell
                                      colSpan={5}
                                      className="text-muted-foreground"
                                    >
                                      لا معاملات مالية بعد.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  (sellingByVisit[visit.id] ?? []).map((tx) => (
                                    <TableRow key={tx.id}>
                                      <TableCell>{sellingTypeAr(tx.type)}</TableCell>
                                      <TableCell className="tabular-nums" dir="ltr">
                                        {tx.money}
                                      </TableCell>
                                      <TableCell className="max-w-[10rem] text-muted-foreground">
                                        {tx.reason}
                                      </TableCell>
                                      <TableCell className="tabular-nums text-muted-foreground">
                                        {new Date(tx.date).toLocaleString(localeAr)}
                                      </TableCell>
                                      <TableCell>
                                        <PopoverForm
                                          title={`تفاصيل المعاملة ${tx.id}`}
                                          open={sellingDetailOpenByTx[tx.id] ?? false}
                                          setOpen={(value) =>
                                            setSellingDetailOpenByTx((prev) => ({ ...prev, [tx.id]: value }))
                                          }
                                          width="520px"
                                          height="300px"
                                          showCloseButton
                                          showSuccess={false}
                                          triggerClassName="h-8 w-8 justify-center p-0"
                                          triggerChild={<Eye className="size-4" />}
                                          openChild={
                                            <div className="flex h-full min-h-0 flex-col px-4 pt-10 pb-4">
                                              <div className="space-y-2 text-sm">
                                                <p>النوع: {sellingTypeAr(tx.type)}</p>
                                                <p dir="ltr">المبلغ: {tx.money}</p>
                                                <p>السبب: {tx.reason}</p>
                                                <p>التاريخ: {new Date(tx.date).toLocaleString(localeAr)}</p>
                                              </div>
                                            </div>
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
                        <div className="min-w-0 space-y-2">
                          <p className="text-center text-xs font-semibold text-muted-foreground">
                            معاملات المخزون
                          </p>
                          <div className="overflow-x-auto rounded-md border bg-background">
                            <Table className="w-full min-w-[34rem] text-xs md:min-w-0">
                              <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                  <TableHead>النوع</TableHead>
                                  <TableHead>إجمالي البيع</TableHead>
                                  <TableHead>تكلفة الشراء</TableHead>
                                  <TableHead>الربح</TableHead>
                                  <TableHead className="whitespace-nowrap">طباعة / تنزيل</TableHead>
                                  <TableHead>عرض</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(inventoryByVisit[visit.id] ?? []).length === 0 ? (
                                  <TableRow className="hover:bg-transparent">
                                    <TableCell
                                      colSpan={6}
                                      className="text-muted-foreground"
                                    >
                                      لا معاملات مخزون بعد.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  (inventoryByVisit[visit.id] ?? []).map((tx) => (
                                    <TableRow key={tx.id}>
                                      <TableCell>{sellTypeAr(tx.type)}</TableCell>
                                      <TableCell className="tabular-nums" dir="ltr">
                                        {tx.totalSell}
                                      </TableCell>
                                      <TableCell className="tabular-nums" dir="ltr">
                                        {tx.totalBuyCost}
                                      </TableCell>
                                      <TableCell className="tabular-nums" dir="ltr">
                                        {tx.benefit}
                                      </TableCell>
                                      <TableCell className="align-middle">
                                        <div className="flex flex-nowrap items-center justify-end gap-0.5">
                                          <button
                                            type="button"
                                            className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                                            aria-label="طباعة الفاتورة"
                                            disabled={Boolean(inventoryReceiptBusy)}
                                            onClick={() => void runInventoryReceiptExport(visit, tx, "print")}
                                          >
                                            <Printer className="size-4" aria-hidden />
                                          </button>
                                          <button
                                            type="button"
                                            className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                                            aria-label="تنزيل الفاتورة كصورة"
                                            disabled={Boolean(inventoryReceiptBusy)}
                                            onClick={() => void runInventoryReceiptExport(visit, tx, "png")}
                                          >
                                            <FileImage className="size-4" aria-hidden />
                                          </button>
                                          <button
                                            type="button"
                                            className="inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                                            aria-label="تنزيل الفاتورة PDF"
                                            disabled={Boolean(inventoryReceiptBusy)}
                                            onClick={() => void runInventoryReceiptExport(visit, tx, "pdf")}
                                          >
                                            <FileText className="size-4" aria-hidden />
                                          </button>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <PopoverForm
                                          title={`تفاصيل المخزون ${tx.id}`}
                                          open={inventoryDetailOpenByTx[tx.id] ?? false}
                                          setOpen={(value) =>
                                            setInventoryDetailOpenByTx((prev) => ({ ...prev, [tx.id]: value }))
                                          }
                                          width="620px"
                                          height="420px"
                                          showCloseButton
                                          showSuccess={false}
                                          triggerClassName="h-8 w-8 justify-center p-0"
                                          triggerChild={<Eye className="size-4" />}
                                          openChild={
                                            <div className="flex h-full min-h-0 flex-col px-4 pt-10 pb-4">
                                              <div className="space-y-2 text-sm">
                                                <p>النوع: {sellTypeAr(tx.type)}</p>
                                                <p dir="ltr">إجمالي البيع: {tx.totalSell}</p>
                                                <p dir="ltr">تكلفة الشراء: {tx.totalBuyCost}</p>
                                                <p dir="ltr">الربح: {tx.benefit}</p>
                                              </div>
                                              <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-md border p-2">
                                                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                                  العناصر
                                                </p>
                                                {(tx.items ?? []).length === 0 ? (
                                                  <p className="text-xs text-muted-foreground">
                                                    لا تفاصيل عناصر متاحة.
                                                  </p>
                                                ) : (
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
                                                      {(tx.items ?? []).map((item) => {
                                                        const productName =
                                                          products.find((p) => p.id === item.productId)?.name ??
                                                          "منتج غير معروف"
                                                        const unitSell = Number(item.unitSellPrice)
                                                        const unitBuy = Number(item.unitBuyPrice)
                                                        const unitBenefit = unitSell - unitBuy
                                                        return (
                                                          <TableRow key={item.id}>
                                                            <TableCell>{productName}</TableCell>
                                                            <TableCell dir="ltr">{item.quantity}</TableCell>
                                                            <TableCell dir="ltr">{item.unitSellPrice}</TableCell>
                                                            <TableCell dir="ltr">{item.unitBuyPrice}</TableCell>
                                                            <TableCell dir="ltr">{unitBenefit}</TableCell>
                                                          </TableRow>
                                                        )
                                                      })}
                                                    </TableBody>
                                                  </Table>
                                                )}
                                              </div>
                                            </div>
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
                        </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="h-3 border-0 hover:bg-transparent">
                    <TableCell colSpan={7} className="border-0 p-0" />
                  </TableRow>
                </Fragment>
              ))
            ) : (
              visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium">{visit.customerName}</TableCell>
                  <TableCell className="tabular-nums" dir="ltr">
                    {visit.phone}
                  </TableCell>
                  <TableCell className="max-w-[14rem] text-muted-foreground">{visit.address}</TableCell>
                  <TableCell>
                    <VisitStatusSelect
                      id={`visit-status-all-${visit.id}`}
                      value={visit.status}
                      disabled={statusUpdatingId === visit.id}
                      onChange={(s) => void onUpdateStatus(visit.id, s)}
                    />
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {new Date(visit.visitDate).toLocaleString(localeAr)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        page={visitsPage}
        totalPages={visitsTotalPages}
        total={visitsTotal}
        loading={loading}
        onPageChange={setVisitsPage}
        noun="معاينة"
      />
    </div>
  )
}
