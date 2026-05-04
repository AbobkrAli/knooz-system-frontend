/** Logo in `apps/web/public/logo.png` — used on حصر امتار / حصر أمتار. */

export function metersSurveyLogoPublicUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "")
  return `${typeof window !== "undefined" ? window.location.origin : ""}${base}/logo.png`
}

/**
 * html2canvas + foreignObjectRendering often draws blank for same-origin `img` URLs.
 * Data URLs rasterize reliably for PNG/PDF export.
 */
export async function fetchMetersSurveyLogoAsDataUrl(): Promise<string> {
  const url = metersSurveyLogoPublicUrl()
  const res = await fetch(url, { mode: "cors", credentials: "same-origin" })
  if (!res.ok) throw new Error(`fetch logo ${res.status}`)
  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = () => reject(fr.error ?? new Error("FileReader failed"))
    fr.readAsDataURL(blob)
  })
}
