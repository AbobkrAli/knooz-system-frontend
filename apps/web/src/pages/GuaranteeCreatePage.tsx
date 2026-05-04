import { GuaranteeCertificate } from "@/components/GuaranteeCertificate"
import { PopoverFormField, popoverFormControlClass } from "@/components/PopoverForm"
import { fetchGuaranteeCertificateImagesAsDataUrl } from "@/lib/guarantee-certificate-assets"
import { printGuaranteeCertificate } from "@/lib/guarantee-certificate-print"
import {
  defaultGuaranteeCertificateData,
  type GuaranteeCertificateData,
} from "@/lib/guarantee-certificate"
import { sanitizeCloneForHtml2Canvas } from "@/lib/html2canvas-sanitize-clone"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { Download, FileImage, FileText, Printer } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { createPortal, flushSync } from "react-dom"

const CERT_WIDTH = 794
/** On-screen preview scale (export is always 1:1). Was 0.46 — too small to read; ~0.72 fits typical desktop preview column. */
const PREVIEW_SCALE = 0.72
/** Integer scale aligns with html2canvas and avoids subpixel drift. */
const EXPORT_SCALE = 2

async function waitForImagesInNode(root: HTMLElement): Promise<void> {
  const imgs = [...root.querySelectorAll("img")]
  await Promise.all(
    imgs.map(
      async (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        }).then(() => img.decode().catch(() => undefined)),
    ),
  )
}

function bind<K extends keyof GuaranteeCertificateData>(
  data: GuaranteeCertificateData,
  setData: Dispatch<SetStateAction<GuaranteeCertificateData>>,
  key: K
) {
  return {
    value: data[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setData((d) => ({ ...d, [key]: e.target.value })),
  }
}

export function GuaranteeCreatePage() {
  const [data, setData] = useState<GuaranteeCertificateData>(defaultGuaranteeCertificateData)
  const [busy, setBusy] = useState<"png" | "pdf" | "print" | null>(null)
  const [certImages, setCertImages] = useState<{ stamp: string; managerSign: string } | null>(null)
  const exportRootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void fetchGuaranteeCertificateImagesAsDataUrl()
      .then((urls) => {
        if (!cancelled) setCertImages(urls)
      })
      .catch(() => {
        if (!cancelled) setCertImages(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const runExport = useCallback(async (kind: "png" | "pdf") => {
    const portalEl = exportRootRef.current
    const target = portalEl?.querySelector("[data-guarantee-certificate]") as HTMLElement | null
    if (!target || !portalEl) return
    setBusy(kind)
    try {
      if (!certImages) {
        try {
          const urls = await fetchGuaranteeCertificateImagesAsDataUrl()
          flushSync(() => setCertImages(urls))
        } catch {
          /* preview/export fall back to absolute URLs on the certificate */
        }
      }
      if (document.fonts?.ready) {
        await document.fonts.ready
      }
      await waitForImagesInNode(portalEl)
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      /**
       * CROP STRATEGY
       * -------------
       * The portal wrapper is `position: fixed; left: 0; top: 0` so
       * getBoundingClientRect().top === 0 and .left === 0 always — no scroll
       * or viewport offset can leak in. We pass the portal wrapper as the
       * html2canvas target (not the inner certificate node) and explicitly
       * set x:0, y:0, scrollX:0, scrollY:0 so the foreignObject viewBox
       * always starts at (0,0). Then we manually crop the resulting canvas
       * to the exact pixel bounds of [data-guarantee-certificate] relative
       * to the portal wrapper.
       *
       * This separates the "Arabic shaping" concern (foreignObjectRendering)
       * from the "crop position" concern (manual canvas crop), removing the
       * ambiguity around getBoundingClientRect + scroll entirely.
       */

      // Measure the certificate node relative to the portal wrapper
      const portalRect = portalEl.getBoundingClientRect()
      const certRect = target.getBoundingClientRect()
      const offsetX = Math.round(certRect.left - portalRect.left)
      const offsetY = Math.round(certRect.top - portalRect.top)
      const certW = Math.ceil(certRect.width)
      const certH = Math.ceil(certRect.height)

      // Capture the entire portal wrapper from (0,0)
      const fullCanvas = await html2canvas(portalEl, {
        scale: EXPORT_SCALE,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        foreignObjectRendering: true,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        width: portalEl.scrollWidth,
        height: portalEl.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        onclone: (_clonedDoc, _clonedElement) => {
          const htmlEl = _clonedDoc.documentElement
          const bodyEl = _clonedDoc.body
          for (const node of [htmlEl, bodyEl]) {
            node.style.setProperty("margin", "0", "important")
            node.style.setProperty("padding", "0", "important")
            node.style.setProperty("overflow", "visible", "important")
          }
          htmlEl.setAttribute("dir", "rtl")
          htmlEl.setAttribute("lang", "ar")

          // Strip shadow/filter from the certificate node inside the clone
          const certNode = _clonedDoc.querySelector(
            "[data-guarantee-certificate]"
          ) as HTMLElement | null
          if (certNode) {
            certNode.style.setProperty("box-shadow", "none", "important")
            certNode.style.setProperty("filter", "none", "important")
          }
          sanitizeCloneForHtml2Canvas(_clonedDoc, _clonedElement as HTMLElement)
        },
      })

      // Manually crop fullCanvas to just the certificate bounds
      const cropX = offsetX * EXPORT_SCALE
      const cropY = offsetY * EXPORT_SCALE
      const cropW = certW * EXPORT_SCALE
      const cropH = certH * EXPORT_SCALE

      const croppedCanvas = document.createElement("canvas")
      croppedCanvas.width = cropW
      croppedCanvas.height = cropH
      const ctx = croppedCanvas.getContext("2d")!
      ctx.drawImage(fullCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

      if (kind === "png") {
        const a = document.createElement("a")
        a.href = croppedCanvas.toDataURL("image/png")
        a.download = `ضمان-${Date.now()}.png`
        a.click()
      } else {
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
        const pageW = pdf.internal.pageSize.getWidth()
        const pageH = pdf.internal.pageSize.getHeight()
        const imgData = croppedCanvas.toDataURL("image/png")
        const imgRatio = croppedCanvas.width / croppedCanvas.height
        const pageRatio = pageW / pageH
        let drawW: number
        let drawH: number
        if (imgRatio > pageRatio) {
          drawW = pageW
          drawH = pageW / imgRatio
        } else {
          drawH = pageH
          drawW = pageH * imgRatio
        }
        const x = (pageW - drawW) / 2
        const y = (pageH - drawH) / 2
        pdf.addImage(imgData, "PNG", x, y, drawW, drawH, undefined, "SLOW")
        pdf.save(`ضمان-${Date.now()}.pdf`)
      }
    } finally {
      setBusy(null)
    }
  }, [certImages])

  const runPrint = useCallback(async () => {
    setBusy("print")
    try {
      await printGuaranteeCertificate(data)
    } finally {
      setBusy(null)
    }
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">إنشاء ضمان</h2>
          <p className="text-sm text-muted-foreground">
            املأ الحقول وشاهد المعاينة مباشرة، ثم نزّل الصورة أو PDF أو اطبع الشهادة بنفس الشكل.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={busy !== null}
            onClick={() => runExport("png")}
          >
            {busy === "png" ? (
              <span className="text-xs">جاري…</span>
            ) : (
              <>
                <FileImage className="size-4" />
                تنزيل صورة
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={busy !== null}
            onClick={() => void runPrint()}
          >
            {busy === "print" ? (
              <span className="text-xs">جاري…</span>
            ) : (
              <>
                <Printer className="size-4" />
                طباعة
              </>
            )}
          </Button>
          <Button
            type="button"
            className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
            disabled={busy !== null}
            onClick={() => runExport("pdf")}
          >
            {busy === "pdf" ? (
              <span className="text-xs">جاري…</span>
            ) : (
              <>
                <FileText className="size-4" />
                تنزيل PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr] xl:grid-cols-[minmax(0,380px)_1fr]">
        <form
          className="max-h-[min(78vh,720px)] space-y-3 overflow-y-auto rounded-lg border border-border bg-white/80 p-3 sm:p-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <SectionTitle>تواريخ الضمان</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <PopoverFormField label="بداية الضمان" htmlFor="g-ws">
              <input
                id="g-ws"
                type="date"
                className={popoverFormControlClass}
                {...bind(data, setData, "warrantyStart")}
              />
            </PopoverFormField>
            <PopoverFormField label="انتهاء الضمان" htmlFor="g-we">
              <input
                id="g-we"
                type="date"
                className={popoverFormControlClass}
                {...bind(data, setData, "warrantyEnd")}
              />
            </PopoverFormField>
          </div>

          <SectionTitle>التسليم والعميل</SectionTitle>
          <PopoverFormField label="ما تم تسليمه" htmlFor="g-del">
            <input
              id="g-del"
              className={popoverFormControlClass}
              {...bind(data, setData, "deliveredItem")}
              placeholder="مثال: جبس بورد بند جبس بورد"
            />
          </PopoverFormField>
          <PopoverFormField label="تاريخ التسليم" htmlFor="g-dd">
            <input
              id="g-dd"
              type="date"
              className={popoverFormControlClass}
              {...bind(data, setData, "deliveryDate")}
            />
          </PopoverFormField>
          <PopoverFormField label="اسم العميل" htmlFor="g-cn">
            <input id="g-cn" className={popoverFormControlClass} {...bind(data, setData, "customerName")} />
          </PopoverFormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <PopoverFormField label="شقة رقم" htmlFor="g-ap">
              <input id="g-ap" className={popoverFormControlClass} {...bind(data, setData, "apartmentNo")} />
            </PopoverFormField>
            <PopoverFormField label="دور" htmlFor="g-fl">
              <input id="g-fl" className={popoverFormControlClass} {...bind(data, setData, "floor")} />
            </PopoverFormField>
            <PopoverFormField label="منطقة" htmlFor="g-ar">
              <input id="g-ar" className={popoverFormControlClass} {...bind(data, setData, "area")} />
            </PopoverFormField>
            <PopoverFormField label="مدينة" htmlFor="g-ci">
              <input id="g-ci" className={popoverFormControlClass} {...bind(data, setData, "city")} />
            </PopoverFormField>
            <PopoverFormField label="شارع" htmlFor="g-st" className="sm:col-span-2">
              <input id="g-st" className={popoverFormControlClass} {...bind(data, setData, "street")} />
            </PopoverFormField>
          </div>

          <SectionTitle>تفاصيل الشغل والخامات</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <PopoverFormField label="نوع الجبس" htmlFor="g-gy">
              <input id="g-gy" className={popoverFormControlClass} {...bind(data, setData, "gypsumType")} />
            </PopoverFormField>
            <PopoverFormField label="سمك الصاج ونوعه" htmlFor="g-sm">
              <input id="g-sm" className={popoverFormControlClass} {...bind(data, setData, "sheetMetal")} />
            </PopoverFormField>
            <PopoverFormField label="نظام التعليق" htmlFor="g-hs">
              <input id="g-hs" className={popoverFormControlClass} {...bind(data, setData, "hangingSystem")} />
            </PopoverFormField>
            <PopoverFormField label="تقفيل معجون" htmlFor="g-jc">
              <input
                id="g-jc"
                className={popoverFormControlClass}
                {...bind(data, setData, "jointingCompound")}
              />
            </PopoverFormField>
            <PopoverFormField label="شاش / ميتل" htmlFor="g-mm" className="sm:col-span-2">
              <input id="g-mm" className={popoverFormControlClass} {...bind(data, setData, "meshMetal")} />
            </PopoverFormField>
          </div>

          <SectionTitle>الأمتار والغرف</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <PopoverFormField label="طولي" htmlFor="g-ml">
              <input id="g-ml" className={popoverFormControlClass} {...bind(data, setData, "metersLinear")} />
            </PopoverFormField>
            <PopoverFormField label="مربع" htmlFor="g-ms">
              <input id="g-ms" className={popoverFormControlClass} {...bind(data, setData, "metersSquare")} />
            </PopoverFormField>
            <PopoverFormField label="معالج" htmlFor="g-mt">
              <input
                id="g-mt"
                className={popoverFormControlClass}
                {...bind(data, setData, "metersTreated")}
              />
            </PopoverFormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PopoverFormField label="غرفة" htmlFor="g-cr">
              <input id="g-cr" className={popoverFormControlClass} {...bind(data, setData, "countRoom")} />
            </PopoverFormField>
            <PopoverFormField label="ريسبشن" htmlFor="g-cre">
              <input
                id="g-cre"
                className={popoverFormControlClass}
                {...bind(data, setData, "countReception")}
              />
            </PopoverFormField>
            <PopoverFormField label="طرقة" htmlFor="g-cc">
              <input
                id="g-cc"
                className={popoverFormControlClass}
                {...bind(data, setData, "countCorridor")}
              />
            </PopoverFormField>
            <PopoverFormField label="حمام" htmlFor="g-cb">
              <input
                id="g-cb"
                className={popoverFormControlClass}
                {...bind(data, setData, "countBathroom")}
              />
            </PopoverFormField>
            <PopoverFormField label="مطبخ" htmlFor="g-ck">
              <input
                id="g-ck"
                className={popoverFormControlClass}
                {...bind(data, setData, "countKitchen")}
              />
            </PopoverFormField>
            <PopoverFormField label="وغيره" htmlFor="g-co">
              <input id="g-co" className={popoverFormControlClass} {...bind(data, setData, "countOther")} />
            </PopoverFormField>
          </div>

          <SectionTitle>السعر المتفق عليه</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <PopoverFormField label="أبيض طولي" htmlFor="g-pwl">
              <input
                id="g-pwl"
                className={popoverFormControlClass}
                {...bind(data, setData, "priceWhiteLinear")}
              />
            </PopoverFormField>
            <PopoverFormField label="مربع (أبيض)" htmlFor="g-pws">
              <input
                id="g-pws"
                className={popoverFormControlClass}
                {...bind(data, setData, "priceWhiteSquare")}
              />
            </PopoverFormField>
            <PopoverFormField label="معالج أخضر/أحمر طولي" htmlFor="g-ptl">
              <input
                id="g-ptl"
                className={popoverFormControlClass}
                {...bind(data, setData, "priceTreatedLinear")}
              />
            </PopoverFormField>
            <PopoverFormField label="مربع (معالج)" htmlFor="g-pts">
              <input
                id="g-pts"
                className={popoverFormControlClass}
                {...bind(data, setData, "priceTreatedSquare")}
              />
            </PopoverFormField>
          </div>

          <PopoverFormField label="اسم الفني — اسم ظاهر" htmlFor="g-ts">
            <input
              id="g-ts"
              className={popoverFormControlClass}
              {...bind(data, setData, "technicianSignature")}
            />
          </PopoverFormField>
        </form>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="size-4 shrink-0 opacity-70" />
            <span>معاينة مباشرة — يطابق مخرجات PNG و PDF (مقاس A4)</span>
          </div>
          <div
            className={cn(
              "overflow-auto rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-100 to-slate-200/60 p-4 sm:p-6 shadow-inner",
              "max-h-[min(88vh,960px)]"
            )}
          >
            <div
              className="mx-auto max-w-full shadow-md"
              style={{
                width: CERT_WIDTH * PREVIEW_SCALE,
              }}
            >
              <div
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top center",
                  width: CERT_WIDTH,
                }}
              >
                <GuaranteeCertificate
                  data={data}
                  stampSrc={certImages?.stamp}
                  managerSignSrc={certImages?.managerSign}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <div
              ref={exportRootRef}
              className="pointer-events-none"
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: -1000,
                width: "max-content",
                maxWidth: "none",
                backgroundColor: "#ffffff",
                border: "none",
                outline: "none",
                boxShadow: "none",
                overflow: "visible",
              }}
              aria-hidden
            >
              <GuaranteeCertificate
                data={data}
                stampSrc={certImages?.stamp}
                managerSignSrc={certImages?.managerSign}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="border-b border-slate-200 pb-1 text-sm font-semibold text-slate-800">{children}</h3>
  )
}