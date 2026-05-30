import { MetersSurveySheet } from "@/components/MetersSurveySheet"
import { fontFamilyAr } from "@/lib/ui-ar"
import type { MetersSurveyMeasureRow, MetersSurveyPriceKey } from "@/lib/meters-survey"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

export type MetersSurveySnapshot = {
  surveyRows1: MetersSurveyMeasureRow[]
  surveyRows2: MetersSurveyMeasureRow[]
  prices: Record<MetersSurveyPriceKey, string>
  magnetMeters: string
  clientName: string
  clientLocation: string
  paid: string
  /** Inline logo for print window (same blank-img issue as html2canvas without data URL). */
  logoDataUrl?: string
}

export async function printMetersSurvey(snapshot: MetersSurveySnapshot): Promise<void> {
  const { logoDataUrl, ...sheetProps } = snapshot
  const html = renderToStaticMarkup(
    createElement(MetersSurveySheet, {
      ...sheetProps,
      readOnly: true,
      logoSrcOverride: logoDataUrl,
    }),
  )

  return new Promise((resolve) => {
    const w = window.open("", "_blank")
    if (!w) {
      resolve()
      return
    }
    w.document.open()
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>حصر امتار — حصر أمتار</title>
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
    @page { size: A4; margin: 10mm; }
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
