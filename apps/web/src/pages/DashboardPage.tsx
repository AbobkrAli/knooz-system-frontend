import { getStatistics, type DashboardStatistics, type StatisticsPreset } from "@/lib/api"
import { err, localeAr } from "@/lib/ui-ar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const statusPieColors: Record<"done" | "pending" | "fail", string> = {
  done: "#22c55e",
  pending: "#3b82f6",
  fail: "#ef4444",
}
const customersColors = ["#0ea5e9", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16", "#ec4899"]
const returnsColors = ["#f59e0b", "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#14b8a6"]
const productSalesColors = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#a855f7",
  "#eab308",
  "#64748b",
]

function formatDateInput(date: Date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

function formatMoney(value: number) {
  return value.toLocaleString(localeAr, { maximumFractionDigits: 2 })
}

const DAYS_BY_PRESET: Record<Exclude<StatisticsPreset, "all" | "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
}

function rollingRangeFromDays(days: number) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - (days - 1))
  return { from: formatDateInput(start), to: formatDateInput(now) }
}

export function DashboardPage({ token }: { token: string }) {
  const [data, setData] = useState<DashboardStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [preset, setPreset] = useState<StatisticsPreset>("30d")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const presetDateRange = useMemo(() => {
    if (preset === "all" || preset === "custom") {
      return null
    }
    return rollingRangeFromDays(DAYS_BY_PRESET[preset])
  }, [preset])

  const displayFrom = preset === "custom" ? fromDate : preset === "all" ? "" : presetDateRange?.from ?? ""
  const displayTo = preset === "custom" ? toDate : preset === "all" ? "" : presetDateRange?.to ?? ""

  useEffect(() => {
    if (preset === "custom") {
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const res = await getStatistics(token, { preset })
        if (!cancelled) {
          setData(res)
        }
      } catch {
        if (!cancelled) {
          setError(err.load)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, preset])

  useEffect(() => {
    if (preset !== "custom") {
      return
    }
    if (!fromDate || !toDate) {
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const res = await getStatistics(token, {
          preset: "custom",
          from: fromDate,
          to: toDate,
        })
        if (!cancelled) {
          setData(res)
        }
      } catch {
        if (!cancelled) {
          setError(err.load)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, preset, fromDate, toDate])

  const kpis = data?.kpis
  const global = data?.global

  const statusData = data
    ? [
        { name: "منجز", value: data.statusBreakdown.done, status: "done" as const },
        {
          name: "قيد الانتظار",
          value: data.statusBreakdown.pending,
          status: "pending" as const,
        },
        { name: "فاشل", value: data.statusBreakdown.fail, status: "fail" as const },
      ].filter((s) => s.value > 0)
    : []

  const cashFlowData =
    data?.cashFlowByDay.map((row) => ({
      day: row.day,
      استلام: row.cashIn,
      دفع: row.cashOut,
      صافي: row.net,
    })) ?? []

  const kpiCards = [
    {
      title: "إجمالي المعاينات",
      value: loading ? "…" : String(kpis?.visitsTotal ?? 0),
      valueDir: "rtl" as const,
      className: "border-indigo-200/70 bg-indigo-50 dark:bg-indigo-950/20",
      valueClassName: "text-indigo-700 dark:text-indigo-300",
    },
    {
      title: "نسبة الإنجاز",
      value: loading ? "…" : `${(kpis?.completionRate ?? 0).toFixed(1)}%`,
      valueDir: "rtl" as const,
      className: "border-emerald-200/70 bg-emerald-50 dark:bg-emerald-950/20",
      valueClassName: "text-emerald-700 dark:text-emerald-300",
    },
    {
      title: "صافي التدفق النقدي",
      value: loading ? "…" : formatMoney(kpis?.netCash ?? 0),
      valueDir: "ltr" as const,
      className: "border-sky-200/70 bg-sky-50 dark:bg-sky-950/20",
      valueClassName: "text-sky-700 dark:text-sky-300",
    },
    {
      title: "رصيد المخزون النقدي",
      value: loading ? "…" : formatMoney(global?.currentMoney ?? 0),
      valueDir: "ltr" as const,
      className: "border-violet-200/70 bg-violet-50 dark:bg-violet-950/20",
      valueClassName: "text-violet-700 dark:text-violet-300",
    },
    {
      title: "قيمة المخزون (تكلفة)",
      value: loading ? "…" : formatMoney(global?.stockValue ?? 0),
      valueDir: "ltr" as const,
      className: "border-cyan-200/70 bg-cyan-50 dark:bg-cyan-950/20",
      valueClassName: "text-cyan-700 dark:text-cyan-300",
    },
    {
      title: "المبالغ المستلمة",
      value: loading ? "…" : formatMoney(kpis?.cashIn ?? 0),
      valueDir: "ltr" as const,
      className: "border-lime-200/70 bg-lime-50 dark:bg-lime-950/20",
      valueClassName: "text-lime-700 dark:text-lime-300",
    },
    {
      title: "المبالغ المدفوعة",
      value: loading ? "…" : formatMoney(kpis?.cashOut ?? 0),
      valueDir: "ltr" as const,
      className: "border-rose-200/70 bg-rose-50 dark:bg-rose-950/20",
      valueClassName: "text-rose-700 dark:text-rose-300",
    },
    {
      title: "المرتجعات (عدد)",
      value: loading ? "…" : String(kpis?.returnsCount ?? 0),
      valueDir: "rtl" as const,
      className: "border-amber-200/70 bg-amber-50 dark:bg-amber-950/20",
      valueClassName: "text-amber-700 dark:text-amber-300",
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">لوحة التحكم</h2>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="grid gap-3 rounded-lg border border-fuchsia-200/70 bg-fuchsia-50/60 p-3 md:grid-cols-3 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/10">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">الفترة</p>
          <Select
            value={preset}
            onValueChange={(v) => {
              const next = v as StatisticsPreset
              if (next === "custom" && preset !== "custom") {
                if (preset === "all") {
                  const r = rollingRangeFromDays(DAYS_BY_PRESET["30d"])
                  setFromDate(r.from)
                  setToDate(r.to)
                } else if (presetDateRange) {
                  setFromDate(presetDateRange.from)
                  setToDate(presetDateRange.to)
                }
              }
              setPreset(next)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">آخر 7 أيام</SelectItem>
              <SelectItem value="30d">آخر 30 يوم</SelectItem>
              <SelectItem value="90d">آخر 90 يوم</SelectItem>
              <SelectItem value="365d">آخر سنة</SelectItem>
              <SelectItem value="all">كل الفترات</SelectItem>
              <SelectItem value="custom">تخصيص</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">من تاريخ</p>
          <input
            type="date"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none"
            value={displayFrom}
            onChange={(e) => {
              setPreset("custom")
              setFromDate(e.target.value)
            }}
            dir="ltr"
            disabled={preset === "all"}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">إلى تاريخ</p>
          <input
            type="date"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none"
            value={displayTo}
            onChange={(e) => {
              setPreset("custom")
              setToDate(e.target.value)
            }}
            dir="ltr"
            disabled={preset === "all"}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.title} className={`rounded-lg border p-4 ${card.className}`}>
            <p className="text-xs text-muted-foreground">{card.title}</p>
            <p className={`mt-2 text-2xl font-semibold ${card.valueClassName}`} dir={card.valueDir}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">تطور عدد المعاينات يوميًا</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.visitsByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.18}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">توزيع الحالات</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={statusPieColors[entry.status]}
                      stroke="#f8fafc"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">التدفق النقدي حسب اليوم</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="استلام" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="دفع" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">أكثر العملاء تكرارًا</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.topCustomers ?? []}
                layout="vertical"
                margin={{ left: 8, right: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={0}
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="visitsCount" radius={[0, 6, 6, 0]}>
                  {(data?.topCustomers ?? []).map((_, i) => (
                    <Cell
                      key={`customer-${i}`}
                      fill={customersColors[i % customersColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 xl:col-span-2">
          <p className="mb-3 text-sm font-semibold">أكثر المنتجات مبيعًا (بالكمية)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topSoldProducts ?? []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" interval={0} angle={-28} textAnchor="end" height={72} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantity" name="الكمية المباعة" radius={[6, 6, 0, 0]}>
                  {(data?.topSoldProducts ?? []).map((_, i) => (
                    <Cell
                      key={`sold-${i}`}
                      fill={productSalesColors[i % productSalesColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 xl:col-span-2">
          <p className="mb-3 text-sm font-semibold">أكثر المنتجات مرتجعات (بالكمية)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topReturns ?? []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
                  {(data?.topReturns ?? []).map((_, i) => (
                    <Cell key={`return-${i}`} fill={returnsColors[i % returnsColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
