import { InvoiceReceipt } from "@/components/InvoiceReceipt"
import type { InvoiceHistoryEntry } from "@/lib/api"
import { fontFamilyAr } from "@/lib/ui-ar"
import { sanitizeCloneForHtml2Canvas } from "@/lib/html2canvas-sanitize-clone"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"

const EXPORT_SCALE = 2

/** Company mark: `apps/web/public/logo.png` (served as `/logo.png`). */
function invoiceLogoSrc(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "")
  return `${window.location.origin}${base}/logo.png`
}

/**
 * html2canvas + foreignObjectRendering often draws a blank for same-origin <img src="http…">
 * inside the cloned SVG. Inlining the logo as a data URL fixes PNG/PDF while print keeps a normal URL.
 */
async function invoiceLogoDataUrlForCanvas(): Promise<string> {
  const url = invoiceLogoSrc()
  try {
    const res = await fetch(url, { mode: "cors", credentials: "same-origin" })
    if (!res.ok) throw new Error(`logo fetch ${res.status}`)
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = () => reject(fr.error ?? new Error("FileReader failed"))
      fr.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}

function receiptMarkup(invoice: InvoiceHistoryEntry, logoSrc: string): string {
  return renderToStaticMarkup(createElement(InvoiceReceipt, { invoice, logoSrc }))
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = [...root.querySelectorAll("img")]
  return Promise.all(
    imgs.map(async (img) => {
      await new Promise<void>((resolve) => {
        if (img.complete) resolve()
        else {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }
      })
      try {
        await img.decode()
      } catch {
        /* ignore */
      }
    }),
  ).then(() => undefined)
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  a.rel = "noopener"
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Mount receipt in a fixed portal at (0,0) — same strategy as ضمان export.
 * Capturing the inner node with rect + scrollX/Y breaks when the user has scrolled
 * (e.g. long «الشغل الحالي» table); we capture the portal with x/y = 0 and crop to the receipt.
 */
async function withMountedReceipt<T>(
  invoice: InvoiceHistoryEntry,
  fn: (ctx: { portal: HTMLElement; target: HTMLElement }) => Promise<T>,
): Promise<T> {
  const logoSrc = await invoiceLogoDataUrlForCanvas()
  const portal = document.createElement("div")
  portal.setAttribute("aria-hidden", "true")
  // Must not use opacity:0 — html2canvas composites the subtree transparent and PNG/PDF look blank/wrong.
  // Same approach as ضمان: fixed at (0,0), behind the app (negative z-index), fully opaque.
  portal.style.cssText =
    "position:fixed;left:0;top:0;z-index:-1000;pointer-events:none;overflow:visible;width:max-content;max-width:none;height:max-content;background:#ffffff;border:none;outline:none;box-shadow:none"
  document.body.appendChild(portal)
  const reactRoot = createRoot(portal)
  reactRoot.render(createElement(InvoiceReceipt, { invoice, logoSrc }))
  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    const target = portal.querySelector("[data-invoice-receipt]") as HTMLElement | null
    if (!target) {
      throw new Error("invoice receipt mount failed")
    }
    await waitForImages(target)
    if (document.fonts?.ready) {
      await document.fonts.ready
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    return await fn({ portal, target })
  } finally {
    reactRoot.unmount()
    portal.remove()
  }
}

async function captureReceiptToCanvas(portal: HTMLElement, target: HTMLElement): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  const portalRect = portal.getBoundingClientRect()
  const certRect = target.getBoundingClientRect()
  const offsetX = Math.round(certRect.left - portalRect.left)
  const offsetY = Math.round(certRect.top - portalRect.top)
  const certW = Math.ceil(certRect.width)
  const certH = Math.ceil(certRect.height)

  const fullCanvas = await html2canvas(portal, {
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
    width: portal.scrollWidth,
    height: portal.scrollHeight,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
    onclone: (_clonedDoc, clonedElement) => {
      const htmlEl = _clonedDoc.documentElement
      const bodyEl = _clonedDoc.body
      for (const node of [htmlEl, bodyEl]) {
        node.style.setProperty("margin", "0", "important")
        node.style.setProperty("padding", "0", "important")
        node.style.setProperty("overflow", "visible", "important")
      }
      htmlEl.setAttribute("dir", "rtl")
      htmlEl.setAttribute("lang", "ar")

      const receiptNode = _clonedDoc.querySelector("[data-invoice-receipt]") as HTMLElement | null
      if (receiptNode) {
        receiptNode.style.setProperty("box-shadow", "none", "important")
        receiptNode.style.setProperty("filter", "none", "important")
      }
      sanitizeCloneForHtml2Canvas(_clonedDoc, clonedElement as HTMLElement)
    },
  })

  const cropX = Math.max(0, offsetX * EXPORT_SCALE)
  const cropY = Math.max(0, offsetY * EXPORT_SCALE)
  const cropW = Math.max(1, Math.min(certW * EXPORT_SCALE, fullCanvas.width - cropX))
  const cropH = Math.max(1, Math.min(certH * EXPORT_SCALE, fullCanvas.height - cropY))

  const croppedCanvas = document.createElement("canvas")
  croppedCanvas.width = Math.floor(cropW)
  croppedCanvas.height = Math.floor(cropH)
  const ctx = croppedCanvas.getContext("2d")!
  ctx.drawImage(fullCanvas, cropX, cropY, cropW, cropH, 0, 0, croppedCanvas.width, croppedCanvas.height)
  return croppedCanvas
}

export async function exportInvoiceReceiptPng(invoice: InvoiceHistoryEntry): Promise<void> {
  await withMountedReceipt(invoice, async ({ portal, target }) => {
    const canvas = await captureReceiptToCanvas(portal, target)
    triggerDownload(canvas.toDataURL("image/png"), `فاتورة-${invoice.id.slice(0, 8)}-${Date.now()}.png`)
  })
}

export async function exportInvoiceReceiptPdf(invoice: InvoiceHistoryEntry): Promise<void> {
  await withMountedReceipt(invoice, async ({ portal, target }) => {
    const canvas = await captureReceiptToCanvas(portal, target)
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgData = canvas.toDataURL("image/png")
    const cw = canvas.width
    const ch = canvas.height
    const imgRatio = cw / ch
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
    pdf.save(`فاتورة-${invoice.id.slice(0, 8)}-${Date.now()}.pdf`)
  })
}

export async function printInvoiceReceipt(invoice: InvoiceHistoryEntry): Promise<void> {
  const logoSrc = await invoiceLogoDataUrlForCanvas()
  const html = receiptMarkup(invoice, logoSrc)
  return new Promise((resolve) => {
    // Do not pass `noopener`: it makes window.open return null in many browsers,
    // so print never runs.
    const w = window.open("", "_blank")
    if (!w) {
      resolve()
      return
    }
    w.document.open()
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>فاتورة بيع</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    padding: 28px 20px 40px;
    min-height: 100vh;
    background: #e8edf2;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    font-family: ${fontFamilyAr};
  }
  @media print {
    @page { size: A4; margin: 12mm; }
    body {
      padding: 0;
      background: #ffffff;
      display: block;
      min-height: 0;
    }
  }
</style></head><body>${html}</body></html>`)
    w.document.close()

    const finish = () => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        try {
          w.close()
        } catch {
          /* ignore */
        }
        resolve()
      }
      try {
        w.focus()
        w.addEventListener("afterprint", () => done(), { once: true })
        w.print()
      } catch {
        done()
        return
      }
      window.setTimeout(done, 2000)
    }

    const imgs = [...w.document.images]
    let pending = imgs.filter((i) => !i.complete).length
    if (pending === 0) {
      requestAnimationFrame(finish)
      return
    }
    for (const img of imgs) {
      if (img.complete) continue
      img.onload = img.onerror = () => {
        pending--
        if (pending <= 0) finish()
      }
    }
  })
}
