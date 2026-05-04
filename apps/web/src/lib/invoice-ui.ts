import type { Product } from "@/lib/api"
import { localeAr } from "@/lib/ui-ar"

export function formatMoneyAr(value: number) {
  return value.toLocaleString(localeAr, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Quantity used for live totals (integer, capped by stock). */
export function effectiveInvoiceQty(lineQty: string, maxStock: number): number {
  const q = Number(lineQty)
  if (!Number.isFinite(q) || q <= 0) return 0
  return Math.min(Math.floor(q), maxStock)
}

export function invoiceDraftTotals(
  items: readonly { productId: string; quantity: string }[],
  products: Product[],
  unitSellKey: "sellPriceInside" | "sellPriceOutside",
) {
  let totalSell = 0
  let totalBuy = 0
  for (const line of items) {
    const p = products.find((x) => x.id === line.productId)
    if (!p) continue
    const q = effectiveInvoiceQty(line.quantity, p.quantity)
    if (q <= 0) continue
    totalSell += q * Number(p[unitSellKey])
    totalBuy += q * Number(p.buyPrice)
  }
  return {
    totalSell,
    totalBuy,
    benefit: totalSell - totalBuy,
  }
}
