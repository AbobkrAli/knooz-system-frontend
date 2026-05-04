import { GuaranteeCertificate } from "@/components/GuaranteeCertificate"
import type { GuaranteeCertificateData } from "@/lib/guarantee-certificate"
import { fetchGuaranteeCertificateImagesAsDataUrl } from "@/lib/guarantee-certificate-assets"
import { fontFamilyAr } from "@/lib/ui-ar"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

export async function printGuaranteeCertificate(data: GuaranteeCertificateData): Promise<void> {
  let stampSrc: string | undefined
  let managerSignSrc: string | undefined
  try {
    const urls = await fetchGuaranteeCertificateImagesAsDataUrl()
    stampSrc = urls.stamp
    managerSignSrc = urls.managerSign
  } catch {
    /* certificate falls back to absolute URLs on <img> */
  }

  const html = renderToStaticMarkup(
    createElement(GuaranteeCertificate, {
      data,
      stampSrc,
      managerSignSrc,
    }),
  )

  return new Promise((resolve) => {
    const w = window.open("", "_blank")
    if (!w) {
      resolve()
      return
    }
    w.document.open()
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>شهادة ضمان</title>
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
