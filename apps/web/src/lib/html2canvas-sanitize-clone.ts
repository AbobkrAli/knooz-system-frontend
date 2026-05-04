/**
 * html2canvas cannot parse oklch()/lch(). Problems:
 * 1. Global `* { border-border; outline-ring/50 }` poisons border/outline colors.
 * 2. **parseBackgroundColor() always reads html + body backgrounds first** (even when
 *    capturing a div), so cloned documentElement/body must not resolve to oklch.
 */
export function sanitizeCloneForHtml2Canvas(clonedDoc: Document, root: HTMLElement) {
  const win = clonedDoc.defaultView
  if (!win) return

  const html = clonedDoc.documentElement
  const body = clonedDoc.body
  if (html) {
    html.style.setProperty("background-color", "#ffffff", "important")
    html.style.setProperty("border-color", "transparent", "important")
    html.style.setProperty("border-width", "0", "important")
    html.style.setProperty("outline", "none", "important")
  }
  if (body) {
    body.style.setProperty("background-color", "#ffffff", "important")
    body.style.setProperty("border-color", "transparent", "important")
    body.style.setProperty("border-width", "0", "important")
    body.style.setProperty("outline", "none", "important")
  }

  const poisoned = (v: string | null | undefined) =>
    Boolean(v && (v.includes("oklch") || v.includes("lch(")))

  const walk = (el: HTMLElement) => {
    const s = win.getComputedStyle(el)

    if (poisoned(s.backgroundColor)) {
      el.style.setProperty("background-color", "transparent", "important")
    }
    const bgImg = s.backgroundImage
    if (bgImg && bgImg !== "none" && (bgImg.includes("oklch") || bgImg.includes("lch("))) {
      el.style.setProperty("background-image", "none", "important")
    }
    if (poisoned(s.color)) {
      el.style.setProperty("color", "#000000", "important")
    }
    if (poisoned(s.outlineColor)) {
      el.style.setProperty("outline", "none", "important")
    }

    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const color = s[`border${side}Color` as keyof CSSStyleDeclaration] as string
      const width = s[`border${side}Width` as keyof CSSStyleDeclaration] as string
      if (poisoned(color)) {
        const kebab = `border-${side.toLowerCase()}-color`
        el.style.setProperty(
          kebab,
          width === "0px" || width === "0" ? "transparent" : "#94a3b8",
          "important"
        )
      }
    }

    if (poisoned(s.boxShadow)) {
      el.style.setProperty("box-shadow", "none", "important")
    }
    if (poisoned(s.textDecorationColor)) {
      el.style.setProperty("text-decoration-color", "#000000", "important")
    }
    if (poisoned(s.textShadow)) {
      el.style.setProperty("text-shadow", "none", "important")
    }
    const webkitStroke = s.getPropertyValue("-webkit-text-stroke-color")
    if (poisoned(webkitStroke)) {
      el.style.setProperty("-webkit-text-stroke-color", "#000000", "important")
    }

    for (let i = 0; i < el.children.length; i++) {
      walk(el.children[i] as HTMLElement)
    }
  }

  walk(root)
}
