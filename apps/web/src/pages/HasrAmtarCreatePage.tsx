import { MetersSurveySheet } from "@/components/MetersSurveySheet"
import { PopoverFormField, popoverFormControlClass } from "@/components/PopoverForm"
import {
  emptyPriceRow,
  newSurveyRow,
  type MetersSurveyMeasureRow,
  type MetersSurveyPriceKey,
} from "@/lib/meters-survey"
import { fetchMetersSurveyLogoAsDataUrl } from "@/lib/meters-survey-assets"
import { printMetersSurvey } from "@/lib/meters-survey-export"
import { sanitizeCloneForHtml2Canvas } from "@/lib/html2canvas-sanitize-clone"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { FileImage, FileText, Printer } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal, flushSync } from "react-dom"

const SHEET_WIDTH = 794
const EXPORT_SCALE = 2
const PREVIEW_SCALE_MAX = 1

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

export function HasrAmtarCreatePage() {
  const [surveyRows, setSurveyRows] = useState<MetersSurveyMeasureRow[]>(() => [newSurveyRow()])
  const [prices, setPrices] = useState(emptyPriceRow)
  const [magnetMeters, setMagnetMeters] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientLocation, setClientLocation] = useState("")
  const [paid, setPaid] = useState("")
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState<"png" | "pdf" | "print" | null>(null)
  const exportRootRef = useRef<HTMLDivElement>(null)
  const previewHostRef = useRef<HTMLDivElement>(null)
  const sheetMeasureRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(PREVIEW_SCALE_MAX)
  const [previewBoxH, setPreviewBoxH] = useState(720)

  const snapshot = useMemo(
    () => ({
      surveyRows,
      prices,
      magnetMeters,
      clientName,
      clientLocation,
      paid,
      logoDataUrl: logoDataUrl ?? undefined,
    }),
    [surveyRows, prices, magnetMeters, clientName, clientLocation, paid, logoDataUrl],
  )

  useEffect(() => {
    let cancelled = false
    void fetchMetersSurveyLogoAsDataUrl()
      .then((url) => {
        if (!cancelled) setLogoDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setLogoDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    const host = previewHostRef.current
    if (!host) return

    const update = () => {
      const w = host.getBoundingClientRect().width
      if (w < 64) return
      const innerPad = 4
      const nextScale = Math.min(PREVIEW_SCALE_MAX, (w - innerPad) / SHEET_WIDTH)
      setPreviewScale(nextScale)
      const naturalH = sheetMeasureRef.current?.offsetHeight ?? 0
      if (naturalH > 0) {
        setPreviewBoxH(naturalH * nextScale)
      }
    }

    const roHost = new ResizeObserver(update)
    roHost.observe(host)
    const sheetNode = sheetMeasureRef.current
    const roSheet = sheetNode ? new ResizeObserver(update) : null
    if (sheetNode && roSheet) {
      roSheet.observe(sheetNode)
    }
    update()
    return () => {
      roHost.disconnect()
      roSheet?.disconnect()
    }
  }, [snapshot])

  const onSurveyCellChange = useCallback(
    (id: string, key: keyof Omit<MetersSurveyMeasureRow, "id">, value: string) => {
      setSurveyRows((rows) => rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
    },
    [],
  )

  const onAddSurveyRow = useCallback(() => {
    setSurveyRows((rows) => [...rows, newSurveyRow()])
  }, [])

  const onRemoveSurveyRow = useCallback((id: string) => {
    setSurveyRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)))
  }, [])

  const onPriceChange = useCallback((k: MetersSurveyPriceKey, v: string) => {
    setPrices((p) => ({ ...p, [k]: v }))
  }, [])

  const runExport = useCallback(async (kind: "png" | "pdf") => {
    const portalEl = exportRootRef.current
    const target = portalEl?.querySelector("[data-meters-survey-sheet]") as HTMLElement | null
    if (!target || !portalEl) return
    setBusy(kind)
    try {
      if (!logoDataUrl) {
        try {
          const u = await fetchMetersSurveyLogoAsDataUrl()
          flushSync(() => setLogoDataUrl(u))
        } catch {
          /* logos may render blank in export without data URL */
        }
      }
      if (document.fonts?.ready) {
        await document.fonts.ready
      }
      await waitForImagesInNode(portalEl)
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      const portalRect = portalEl.getBoundingClientRect()
      const sheetRect = target.getBoundingClientRect()
      const offsetX = Math.round(sheetRect.left - portalRect.left)
      const offsetY = Math.round(sheetRect.top - portalRect.top)
      const sheetW = Math.ceil(sheetRect.width)
      const sheetH = Math.ceil(sheetRect.height)

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
          const sheetNode = _clonedDoc.querySelector("[data-meters-survey-sheet]") as HTMLElement | null
          if (sheetNode) {
            sheetNode.style.setProperty("box-shadow", "none", "important")
            sheetNode.style.setProperty("filter", "none", "important")
          }
          sanitizeCloneForHtml2Canvas(_clonedDoc, _clonedElement as HTMLElement)
        },
      })

      const cropX = offsetX * EXPORT_SCALE
      const cropY = offsetY * EXPORT_SCALE
      const cropW = sheetW * EXPORT_SCALE
      const cropH = sheetH * EXPORT_SCALE

      const croppedCanvas = document.createElement("canvas")
      croppedCanvas.width = cropW
      croppedCanvas.height = cropH
      const ctx = croppedCanvas.getContext("2d")!
      ctx.drawImage(fullCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

      if (kind === "png") {
        const a = document.createElement("a")
        a.href = croppedCanvas.toDataURL("image/png")
        a.download = `حصر-امتار-${Date.now()}.png`
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
        pdf.save(`حصر-امتار-${Date.now()}.pdf`)
      }
    } finally {
      setBusy(null)
    }
  }, [logoDataUrl])

  const runPrint = useCallback(async () => {
    setBusy("print")
    try {
      let url = logoDataUrl
      if (!url) {
        try {
          url = await fetchMetersSurveyLogoAsDataUrl()
          flushSync(() => setLogoDataUrl(url))
        } catch {
          url = null
        }
      }
      await printMetersSurvey({ ...snapshot, logoDataUrl: url ?? undefined })
    } finally {
      setBusy(null)
    }
  }, [snapshot, logoDataUrl])

  return (
    <div
      className={cn(
        "space-y-4 max-md:space-y-3",
        "max-md:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]",
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">انشاء حصر امتار</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            <span className="max-md:hidden">
              حصر امتار — عبّئ الجداول ثم نزّل صورة أو PDF أو اطبع. يبدأ بصف واحد؛ استخدم «إضافة صف» لباقي
              الأماكن.
            </span> //s
            <span className="md:hidden">عبّئ الجداول في المعاينة، ثم صورة أو PDF أو طباعة من الشريط أسفل الشاشة.</span>
          </p>
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
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

      <div className="grid max-w-full gap-4 max-md:grid-cols-1 max-md:gap-3 md:grid-cols-[minmax(0,240px)_1fr] lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <form
          className="max-h-[min(78vh,720px)] space-y-3 overflow-y-auto rounded-lg border border-border bg-white/80 p-3 sm:p-4 max-md:max-h-none max-md:overflow-visible max-md:shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <p className="text-xs font-semibold text-muted-foreground">بيانات الظهور في أسفل المستند</p>
          <PopoverFormField label="اسم العميل" htmlFor="hasr-client">
            <input
              id="hasr-client"
              className={popoverFormControlClass}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="مثال: الحج حلمي"
            />
          </PopoverFormField>
          <PopoverFormField label="موقع المشروع" htmlFor="hasr-loc">
            <input
              id="hasr-loc"
              className={popoverFormControlClass}
              value={clientLocation}
              onChange={(e) => setClientLocation(e.target.value)}
              placeholder="مثال: تايم سيتي اكتوبر"
            />
          </PopoverFormField>
        </form>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <span>معاينة — نفس التنزيل والطباعة</span>
          </div>
          <div
            className={cn(
              "overflow-auto rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-100 to-slate-200/60 p-2 shadow-inner sm:p-4",
              "max-h-[min(88vh,960px)] max-md:max-h-[min(72vh,560px)] max-md:rounded-lg",
            )}
          >
            <div ref={previewHostRef} className="w-full min-w-0">
              <div
                className="relative mx-auto shadow-md"
                style={{
                  width: SHEET_WIDTH * previewScale,
                  height: Math.max(previewBoxH, 120),
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    width: SHEET_WIDTH,
                    transform: `translateX(-50%) scale(${previewScale})`,
                    transformOrigin: "top center",
                  }}
                >
                  <div ref={sheetMeasureRef} style={{ width: SHEET_WIDTH }}>
                    <MetersSurveySheet
                      logoSrcOverride={logoDataUrl ?? undefined}
                      surveyRows={surveyRows}
                      prices={prices}
                      magnetMeters={magnetMeters}
                      clientName={clientName}
                      clientLocation={clientLocation}
                      paid={paid}
                      onSurveyCellChange={onSurveyCellChange}
                      onAddSurveyRow={onAddSurveyRow}
                      onRemoveSurveyRow={onRemoveSurveyRow}
                      onPriceChange={onPriceChange}
                      onMagnetMeters={setMagnetMeters}
                      onPaid={setPaid}
                    />
                  </div>
                </div>
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
              <MetersSurveySheet
                logoSrcOverride={logoDataUrl ?? undefined}
                surveyRows={surveyRows}
                prices={prices}
                magnetMeters={magnetMeters}
                clientName={clientName}
                clientLocation={clientLocation}
                paid={paid}
                onSurveyCellChange={onSurveyCellChange}
                onAddSurveyRow={onAddSurveyRow}
                onRemoveSurveyRow={onRemoveSurveyRow}
                onPriceChange={onPriceChange}
                onMagnetMeters={setMagnetMeters}
                onPaid={setPaid}
              />
            </div>,
            document.body,
          )
        : null}

      <div
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-slate-200/90 bg-white/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_28px_rgba(15,23,42,0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 md:hidden"
        role="toolbar"
        aria-label="تصدير عرض السعر"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto min-h-11 touch-manipulation flex-col gap-0.5 py-2 text-[11px] font-medium"
          disabled={busy !== null}
          onClick={() => runExport("png")}
        >
          {busy === "png" ? (
            <span>جاري…</span>
          ) : (
            <>
              <FileImage className="size-4 shrink-0" />
              صورة
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto min-h-11 touch-manipulation flex-col gap-0.5 py-2 text-[11px] font-medium"
          disabled={busy !== null}
          onClick={() => void runPrint()}
        >
          {busy === "print" ? (
            <span>جاري…</span>
          ) : (
            <>
              <Printer className="size-4 shrink-0" />
              طباعة
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-auto min-h-11 touch-manipulation flex-col gap-0.5 bg-slate-900 py-2 text-[11px] font-medium text-white hover:bg-slate-800"
          disabled={busy !== null}
          onClick={() => runExport("pdf")}
        >
          {busy === "pdf" ? (
            <span>جاري…</span>
          ) : (
            <>
              <FileText className="size-4 shrink-0" />
              PDF
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
