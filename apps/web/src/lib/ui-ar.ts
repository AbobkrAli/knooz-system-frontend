import type { Role } from "@/lib/api"

/** Arabic (Saudi) for dates and numbers */
export const localeAr = "ar-SA"

/**
 * Primary UI + document font for Arabic (Google Fonts `Cairo` in index.html).
 * `Inter Variable` is bundled for Latin via `@workspace/ui`; Cairo covers Arabic glyphs.
 */
export const fontFamilyAr =
  '\'Cairo\', "Inter Variable", Inter, system-ui, "Segoe UI", Tahoma, sans-serif'

export const err = {
  load: "تعذّر تحميل البيانات.",
  request: "تعذّر تنفيذ الطلب. تحقّق من الاتصال أو البيانات.",
  create: "تعذّر إنشاء السجل.",
  login: "فشل تسجيل الدخول.",
  status: "تعذّر تحديث الحالة.",
  selling: "تعذّر حفظ المعاملة المالية.",
  inventory: "تعذّر حفظ معاملة المخزون.",
} as const

export function roleAr(role: Role): string {
  return role === "admin" ? "مشرف" : "عامل"
}

export function visitStatusAr(status: string): string {
  switch (status) {
    case "pending":
      return "قيد الانتظار"
    case "done":
      return "منجز"
    case "fail":
      return "فاشل"
    default:
      return status
  }
}

export function sellTypeAr(type: string): string {
  return type === "inside" ? "فاتورة داخلية" : "فاتورة خارجية"
}

export function sellingTypeAr(type: string): string {
  return type === "get" ? "استلام" : "دفع"
}
