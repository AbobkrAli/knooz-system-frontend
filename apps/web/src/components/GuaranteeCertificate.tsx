import { forwardRef, type ReactNode } from "react"
import {
  displayField,
  splitIsoDate,
  type GuaranteeCertificateData,
} from "@/lib/guarantee-certificate"
import { guaranteeManagerSignPublicUrl, guaranteeStampPublicUrl } from "@/lib/guarantee-certificate-assets"
import { fontFamilyAr } from "@/lib/ui-ar"

/** Hex/rgba only — html2canvas cannot parse oklch() from the app theme. */
const gc = {
  paper: "#faf8f4",
  white: "#ffffff",
  black: "#0c0a09",

  /** Primary brand — deep navy */
  navy: "#1a2e4a",
  navyMid: "#243d60",
  navyLight: "#2e5082",
  navyBorder: "rgba(26, 46, 74, 0.18)",
  navyTint: "rgba(26, 46, 74, 0.05)",

  /** Accent — warm gold */
  gold: "#b8922a",
  goldLight: "#d4aa4a",
  goldPale: "#f5edda",
  goldBorder: "rgba(184, 146, 42, 0.35)",

  /** Functional red */
  red: "#9b1c1c",
  redLight: "#fee2e2",
  redBorder: "rgba(155, 28, 28, 0.25)",

  /** Neutrals */
  n50: "#f8f7f4",
  n100: "#f0ede6",
  n200: "#e4dfd4",
  n300: "#ccc5b6",
  n400: "#a89e8e",
  n500: "#7d7468",
  n600: "#5c5549",
  n700: "#3d3830",
  n800: "#252219",
  n900: "#131008",

  shadow: "0 2px 8px rgba(26, 46, 74, 0.08)",
  shadowLg: "0 6px 24px rgba(26, 46, 74, 0.10)",
}

/**
 * html2canvas (raster mode, no foreignObject) draws text via Canvas2D which
 * does NOT honour the CSS `direction` property — it simply measures and
 * renders each glyph independently, so Arabic letters appear isolated
 * (ك ن و ز) instead of joined (كنوز).
 *
 * Fix: force the browser's own text-shaping by keeping foreignObjectRendering
 * OFF (already done in runExport) AND by making every text node sit inside an
 * element whose computed style carries:
 *   direction: rtl
 *   unicode-bidi: embed          ← tells the bidi algorithm to treat the run as RTL
 *   font-feature-settings: includes "calt","liga","kern","rlig","curs","mset"
 *
 * We apply these on the root wrapper via inline style, which propagates via
 * CSS inheritance to every descendant automatically.
 */
const arabicShapingStyle: React.CSSProperties = {
  direction: "rtl",
  unicodeBidi: "embed",
  fontFeatureSettings: '"liga" 1, "calt" 1, "kern" 1, "rlig" 1, "curs" 1, "mset" 1',
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: "antialiased",
}


/** Thin horizontal rule with centered diamond */
function Divider({ margin = 16 }: { margin?: number }) {
  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBlock: margin,
      }}
    >
      <div style={{ flex: 1, height: 1, backgroundColor: gc.n200 }} />
      <svg width="8" height="8" viewBox="0 0 8 8">
        <rect x="1" y="1" width="6" height="6" fill={gc.gold} transform="rotate(45 4 4)" />
      </svg>
      <div style={{ flex: 1, height: 1, backgroundColor: gc.n200 }} />
    </div>
  )
}

function termsIntro(customerName: string) {
  return `يتشرف مكتب كنوز للديكور بمنح السيد ${displayField(customerName)} ضمانًا لمدة عشر سنوات اعتبارًا من تاريخ التسليم الموضح أدناه، وذلك على الأعمال المنفذة وفق المواصفات المذكورة في هذا المستند.`
}

const staticTermsPoints = [
  "ضمان جودة الخامات المستخدمة وفق ما تم الاتفاق عليه.",
  "ضمان جودة التنفيذ والتركيب حسب المعايير المهنية المتعارف عليها.",
  "يقتصر الضمان على الأعمال المنفذة من قبل المكتب ولا يشمل أعمال الغير.",
  "يُراعى الصيانة الدورية وعدم إتلاف التشطيبات عمدًا للحفاظ على سريان الضمان.",
]

const staticNoteBody =
  "يسقط الضمان في حال التلف العمدي أو الحفر لتوصيلات الكهرباء أو التكييف أو أي تعديلات دون تنسيق مع المكتب."

const staticExclusions = [
  "عيوب الدهانات أو أعمال التشطيب النهائي غير المنفذة من قبل المكتب.",
  "تسربات المياه أو الرطوبة الناتجة عن أعمال السباكة أو العزل.",
  "أي أضرار ناتجة عن كوارث أو قوة قاهرة.",
]

type Props = {
  data: GuaranteeCertificateData
  /** Prefer data URLs so PNG/PDF export (html2canvas) renders reliably. */
  stampSrc?: string
  managerSignSrc?: string
}

export const GuaranteeCertificate = forwardRef<HTMLDivElement, Props>(
  function GuaranteeCertificate({ data, stampSrc, managerSignSrc }, ref) {
    const ws = splitIsoDate(data.warrantyStart)
    const we = splitIsoDate(data.warrantyEnd)
    const dd = splitIsoDate(data.deliveryDate)
    const stamp = stampSrc ?? guaranteeStampPublicUrl()
    const mgrSign = managerSignSrc ?? guaranteeManagerSignPublicUrl()

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        data-guarantee-certificate
        style={{
          width: 794,
          fontFamily: fontFamilyAr,
          fontSize: 11,
          lineHeight: 1.7,
          backgroundColor: gc.paper,
          color: gc.n800,
          position: "relative",
          boxSizing: "border-box",
          paddingTop: 32,
          paddingBottom: 32,
          ...arabicShapingStyle,
        }}
      >
        {/* Outer border frame */}
        <div
          style={{
            margin: 18,
            border: `1.5px solid ${gc.navyBorder}`,
            borderRadius: 4,
            backgroundColor: gc.white,
            position: "relative",
            boxShadow: gc.shadowLg,
          }}
        >
         

          {/* Navy top bar */}
          <div
            style={{
              backgroundColor: gc.navy,
              borderRadius: "2px 2px 0 0",
              padding: "10px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ color: gc.goldLight, fontSize: 10, fontWeight: 600, opacity: 0.85, }}>
              شهادة ضمان معتمدة
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
             
              <span
                style={{
                  color: gc.white,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                كنوز للمقاولات العامة والتوريدات
              </span>
            
            </div>
            <div style={{ color: gc.goldLight, fontSize: 10, fontWeight: 600, opacity: 0.85 }}>
              ضمان 20 سنه
            </div>
          </div>

          {/* Gold accent line */}
          

          {/* Main content */}
          <div style={{ padding: "22px 32px 28px" }}>

            {/* ── Warranty dates ribbon ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 0,
                marginBottom: 20,
              }}
            >
              {[
                { label: "تاريخ بداية الضمان", d: ws.d, m: ws.m, y: ws.y },
                { label: "تاريخ انتهاء الضمان", d: we.d, m: we.m, y: we.y },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "10px 16px",
                    backgroundColor: i === 0 ? gc.navyTint : gc.goldPale,
                    borderTop: `2px solid ${i === 0 ? gc.navyLight : gc.gold}`,
                    borderBottom: `1px solid ${i === 0 ? gc.navyBorder : gc.goldBorder}`,
                    borderRight: i === 0 ? `1px solid ${gc.navyBorder}` : `1px solid ${gc.goldBorder}`,
                    borderLeft: i === 0 ? `1px solid ${gc.navyBorder}` : `1px solid ${gc.goldBorder}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: i === 0 ? gc.navyMid : gc.gold,
                      marginBottom: 5,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: i === 0 ? gc.navy : gc.n700,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {item.d || ""} / {item.m || ""} / {item.y || ""}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Two-column body ── */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

              {/* LEFT COLUMN — details */}
              <div style={{ flex: "0 0 430px", minWidth: 0 }}>

                {/* Client / delivery intro block */}
                <div
                  style={{
                    borderRadius: 6,
                    border: `1px solid ${gc.n200}`,
                    overflow: "hidden",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: gc.navy,
                      padding: "6px 14px",
                      fontSize: 10,
                      fontWeight: 800,
                      color: gc.white,
                      letterSpacing: "0.02em",
                    }}
                  >
                    بيانات التسليم والعميل
                  </div>
                  <div style={{ padding: "12px 14px", backgroundColor: gc.white }}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: gc.n500, fontWeight: 600 }}>تم تسليم: </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: gc.n800,
                          borderBottom: `1.5px solid ${gc.gold}`,
                          paddingBottom: 1,
                        }}
                      >
                        {displayField(data.deliveredItem)}
                      </span>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: gc.n500, fontWeight: 600 }}>تاريخ التسليم: </span>
                      <span style={{ fontWeight: 700, color: gc.n800, fontVariantNumeric: "tabular-nums" }}>
                        {dd.d || ""} / {dd.m || ""} / {dd.y || ""}
                      </span>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ color: gc.n500, fontWeight: 600 }}>اسم العميل: </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 12,
                          color: gc.navy,
                          borderBottom: `1.5px solid ${gc.navyLight}`,
                          paddingBottom: 1,
                        }}
                      >
                        {displayField(data.customerName)}
                      </span>
                    </div>
                    <Divider margin={8} />
                    {/* Address grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px 16px",
                        fontSize: 10,
                      }}
                    >
                      <AddrField label="شقة رقم" value={data.apartmentNo} />
                      <AddrField label="دور" value={data.floor} />
                      <AddrField label="منطقة" value={data.area} />
                      <AddrField label="مدينة" value={data.city} />
                      <div style={{ gridColumn: "1 / -1" }}>
                        <AddrField label="شارع" value={data.street} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Materials block */}
                <Block title="تفاصيل الشغل ونوع الخامات" accent="navy">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px 16px",
                    }}
                  >
                    <MatRow label="نوع الجبس" value={data.gypsumType} />
                    <MatRow label="سمك الصاج ونوعه" value={data.sheetMetal} />
                    <MatRow label="نظام التعليق" value={data.hangingSystem} />
                    <MatRow label="تقفيل معجون" value={data.jointingCompound} />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <MatRow label="شاش / ميتل" value={data.meshMetal} />
                    </div>
                  </div>
                </Block>

                {/* Meters + rooms */}
                <Block title="الأمتار والغرف" accent="gold" style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "طولي", value: data.metersLinear },
                      { label: "مربع", value: data.metersSquare },
                      { label: "معالج", value: data.metersTreated },
                    ].map((m) => (
                      <div
                        key={m.label}
                        style={{
                          flex: 1,
                          textAlign: "center",
                          padding: "8px 6px",
                          borderRadius: 5,
                          border: `1px solid ${gc.goldBorder}`,
                          backgroundColor: gc.goldPale,
                        }}
                      >
                        <div style={{ fontSize: 9, fontWeight: 700, color: gc.gold, marginBottom: 4 }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: gc.n800 }}>
                          {displayField(m.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px 12px",
                      fontSize: 10,
                      paddingTop: 8,
                      borderTop: `1px dashed ${gc.n200}`,
                    }}
                  >
                    {[
                      { label: "غرفة", value: data.countRoom },
                      { label: "ريسبشن", value: data.countReception },
                      { label: "طرقة", value: data.countCorridor },
                      { label: "حمام", value: data.countBathroom },
                      { label: "مطبخ", value: data.countKitchen },
                      { label: "وغيره", value: data.countOther },
                    ].map((c) => (
                      <span key={c.label}>
                        <span style={{ color: gc.n500 }}>{c.label}: </span>
                        <span style={{ fontWeight: 700, color: gc.n800 }}>{displayField(c.value)}</span>
                      </span>
                    ))}
                  </div>
                </Block>

                {/* Prices */}
                <Block title="السعر المتفق عليه" accent="navy" style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {[
                      { label: "أبيض طولي", value: data.priceWhiteLinear },
                      { label: "أبيض مربع", value: data.priceWhiteSquare },
                      { label: "معالج أخضر/أحمر طولي", value: data.priceTreatedLinear },
                      { label: "معالج مربع", value: data.priceTreatedSquare },
                    ].map((p) => (
                      <div
                        key={p.label}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 5,
                          border: `1px solid ${gc.n200}`,
                          backgroundColor: gc.n50,
                        }}
                      >
                        <div style={{ fontSize: 9, color: gc.n500, fontWeight: 600, marginBottom: 3 }}>
                          {p.label}
                        </div>
                        <div style={{ fontWeight: 800, color: gc.navy, fontSize: 12 }}>
                          {displayField(p.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </Block>

                {/* Signatures */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginTop: 18,
                    paddingTop: 16,
                    borderTop: `1px solid ${gc.n200}`,
                    gap: 16,
                  }}
                >
                  {/* Company stamp */}
                  <div
                    style={{
                      width: 162,
                      height: 162,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4,
                      boxSizing: "border-box",
                    }}
                  >
                    <img
                      src={stamp}
                      alt="ختم الشركة"
                      loading="eager"
                      decoding="async"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 32,  flex: 1, justifyContent: "flex-end" }}>
                    <SigBlock   label="اسم الفني" name={data.technicianSignature} />
                    <ManagerSignBlock src={mgrSign} />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — terms */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    borderRadius: 6,
                    border: `1px solid ${gc.n200}`,
                    overflow: "hidden",
                    height: "100%",
                  }}
                >
                  {/* Terms header */}
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${gc.navy} 0%, ${gc.navyLight} 100%)`,
                      padding: "10px 14px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: gc.white, marginBottom: 2 }}>
                      شروط الضمان
                    </div>
                    <div
                      style={{
                        width: 30,
                        height: 1.5,
                        backgroundColor: gc.goldLight,
                        margin: "0 auto",
                        opacity: 0.8,
                      }}
                      aria-hidden
                    />
                  </div>

                  <div style={{ padding: "14px 14px 16px", backgroundColor: gc.white }}>
                    {/* Intro */}
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: 10,
                        lineHeight: 1.75,
                        color: gc.n700,
                        textAlign: "justify",
                        padding: "10px 12px",
                        backgroundColor: gc.navyTint,
                        borderRadius: 5,
                        borderRight: `3px solid ${gc.navyLight}`,
                      }}
                    >
                      {termsIntro(data.customerName)}
                    </p>

                    {/* Terms list */}
                    <div style={{ marginBottom: 14 }}>
                      {staticTermsPoints.map((t, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 7,
                            fontSize: 10,
                            color: gc.n700,
                            lineHeight: 1.65,
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              marginTop: 3,
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              backgroundColor: gc.navy,
                              color: gc.white,
                              fontSize: 8,
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {i + 1}
                          </div>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>

                    {/* Warning note */}
                    <div
                      style={{
                        borderRadius: 5,
                        border: `1px solid ${gc.redBorder}`,
                        backgroundColor: gc.redLight,
                        padding: "9px 12px",
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: gc.red,
                          marginBottom: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            backgroundColor: gc.red,
                            color: gc.white,
                            fontSize: 9,
                            fontWeight: 800,
                            textAlign: "center",
                            lineHeight: "14px",
                          }}
                        >
                          !
                        </span>
                        ملحوظة هامة
                      </div>
                      <p style={{ margin: 0, fontSize: 10, color: gc.n700, lineHeight: 1.65 }}>
                        {staticNoteBody}
                      </p>
                    </div>

                    {/* Exclusions */}
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: gc.n800,
                          marginBottom: 8,
                          paddingBottom: 5,
                          borderBottom: `1px solid ${gc.n200}`,
                        }}
                      >
                        حالات لا يشملها الضمان
                      </div>
                      {staticExclusions.map((t, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 6,
                            marginBottom: 6,
                            fontSize: 10,
                            color: gc.n600,
                            lineHeight: 1.6,
                          }}
                        >
                          <span
                            style={{
                              flexShrink: 0,
                              marginTop: 4,
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              backgroundColor: gc.n400,
                              display: "inline-block",
                            }}
                          />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gold bottom bar */}
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, ${gc.navyLight}, ${gc.gold} 40%, ${gc.goldLight} 60%, ${gc.gold} 80%, ${gc.navyLight})`,
            }}
            aria-hidden
          />
          <div
            style={{
              backgroundColor: gc.navy,
              borderRadius: "0 0 2px 2px",
              padding: "8px 32px 10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 1,
                  backgroundColor: gc.goldLight,
                  opacity: 0.4,
                }}
                aria-hidden
              />
              <span style={{ fontSize: 9, color: gc.goldLight, opacity: 0.7, fontWeight: 600 }}>
                كنوز للديكور والمقاولات العامة — شهادة ضمان رسمية
              </span>
              <div
                style={{
                  width: 24,
                  height: 1,
                  backgroundColor: gc.goldLight,
                  opacity: 0.4,
                }}
                aria-hidden
              />
            </div>
            <span
              style={{
                fontSize: 8.5,
                color: gc.goldLight,
                opacity: 0.8,
                fontWeight: 600,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}
            >
              سجل تجاري رقم 19295
            </span>
          </div>
        </div>
      </div>
    )
  }
)

/* ── Small helper components ── */

function Block({
  title,
  accent,
  children,
  style,
}: {
  title: string
  accent: "navy" | "gold"
  children: ReactNode
  style?: React.CSSProperties
}) {
  const accentColor = accent === "navy" ? gc.navy : gc.gold
  const accentBorder = accent === "navy" ? gc.navyBorder : gc.goldBorder
  return (
    <div
      style={{
        borderRadius: 6,
        border: `1px solid ${accentBorder}`,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          backgroundColor: accent === "navy" ? gc.navyTint : gc.goldPale,
          borderBottom: `1.5px solid ${accentBorder}`,
          padding: "5px 12px",
          fontSize: 9,
          fontWeight: 800,
          color: accentColor,
          letterSpacing: "0.03em",
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "10px 12px", backgroundColor: gc.white }}>{children}</div>
    </div>
  )
}

function AddrField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: gc.n500, fontWeight: 600 }}>{label}: </span>
      <span style={{ fontWeight: 700, color: gc.n800 }}>{displayField(value)}</span>
    </div>
  )
}

function MatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderBottom: `1px dotted ${gc.n200}`, paddingBottom: 4 }}>
      <div style={{ fontSize: 9, color: gc.n500, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: gc.n800, fontSize: 11 }}>{displayField(value)}</div>
    </div>
  )
}

function SigBlock({ label, name }: { label: string; name: string }) {
  const printed = name.trim()
  return (
    <div style={{ textAlign: "center", minWidth: 140 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: gc.n700, marginBottom: 6 }}>{label}</div>
      {printed ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            fontWeight: 700,  
            transform: "translateY(10px)",
            color: gc.n800,
            lineHeight: 1.35,
          }}
        >
          {printed}
        </div>
      ) : null}
      <div
        style={{
          minHeight: printed ? 32 : 50,
          marginBottom: 6,
          borderBottom: `1px solid ${gc.n400}`,
        }}
      />
    </div>
  )
}

/** مدير المكتب — scanned signature (`public/manager-sign.png` or inlined data URL). */
function ManagerSignBlock({ src }: { src: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 110 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: gc.n700, marginBottom: 6 }}>مدير المكتب</div>
      <div
        style={{
          height: 50,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={src}
          alt="إمضاء مدير المكتب"
          loading="eager"
          decoding="async"
          style={{
            maxHeight: 50,
            maxWidth: 160,
            width: "auto",
            height: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    </div>
  )
}