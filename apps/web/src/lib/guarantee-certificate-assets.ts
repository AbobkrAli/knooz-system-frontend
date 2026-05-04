/** PNGs in `apps/web/public/` — used on شهادة الضمان. */

export function guaranteeStampPublicUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "")
  return `${typeof window !== "undefined" ? window.location.origin : ""}${base}/company-stamp.png`
}

export function guaranteeManagerSignPublicUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "")
  return `${typeof window !== "undefined" ? window.location.origin : ""}${base}/manager-sign.png`
}

/**
 * html2canvas + foreignObjectRendering often draws blank for same-origin `img` URLs.
 * Data URLs rasterize reliably for PNG/PDF export and on-screen preview.
 */
export async function fetchGuaranteeCertificateImagesAsDataUrl(): Promise<{
  stamp: string
  managerSign: string
}> {
  const toDataUrl = async (absoluteUrl: string) => {
    const res = await fetch(absoluteUrl, { mode: "cors", credentials: "same-origin" })
    if (!res.ok) throw new Error(`fetch ${res.status}`)
    const blob = await res.blob()
    return new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = () => reject(fr.error ?? new Error("FileReader failed"))
      fr.readAsDataURL(blob)
    })
  }

  const stampUrl = guaranteeStampPublicUrl()
  const signUrl = guaranteeManagerSignPublicUrl()
  const [stamp, managerSign] = await Promise.all([toDataUrl(stampUrl), toDataUrl(signUrl)])
  return { stamp, managerSign }
}
