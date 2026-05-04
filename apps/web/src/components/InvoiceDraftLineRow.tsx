import { cn } from "@workspace/ui/lib/utils"

const qtyInputClass =
  "h-7 w-[80px] shrink-0 rounded-md border border-border bg-background px-1 py-0 text-center text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

type Props = {
  productName: string
  stock: number
  sellPriceFormatted: string
  quantity: string
  maxQuantity: number
  onQuantityChange: (value: string) => void
  onRemove: () => void
}

/** Compact row for «المنتجات المضافة للفاتورة/المرتجع» in modals. */
export function InvoiceDraftLineRow({
  productName,
  stock,
  sellPriceFormatted,
  quantity,
  maxQuantity,
  onQuantityChange,
  onRemove,
}: Props) {
  return (
    <div
      className={cn(
        "grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 rounded border bg-background px-2 py-1",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-start-2 motion-safe:duration-200 motion-safe:ease-out",
      )}
    >
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-xs font-medium leading-tight">{productName}</p>
        <p className="truncate text-[10px] leading-tight text-muted-foreground" dir="ltr">
          مخزون {stock} · سعر البيع {sellPriceFormatted} ·
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1.5 justify-self-end">
        <input
          className={qtyInputClass}
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          required
          dir="ltr"
        />
        <button
          type="button"
          className="h-7 shrink-0 whitespace-nowrap rounded-md border border-border bg-background px-2 text-[10px] font-medium text-rose-600 hover:bg-rose-50"
          onClick={onRemove}
        >
          حذف
        </button>
      </div>
    </div>
  )
}
