import { forwardRef, type CSSProperties } from "react"
import {
  METERS_SURVEY_PRICE_LABELS,
  computedProcessedCell,
  formatSurveyNumber,
  parseMoneyLike,
  surveyColumnTotals,
  type MetersSurveyMeasureRow,
  type MetersSurveyPriceKey,
} from "@/lib/meters-survey"
import { fontFamilyAr } from "@/lib/ui-ar"

const ink = "#0f172a"
const border = "#1e293b"
const muted = "#64748b"
const headerBg = "#e2e8f0"
const cellPad = "4px 6px"

const logoSrcDefault = () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "")
  return `${typeof window !== "undefined" ? window.location.origin : ""}${base}/logo.png`
}

const inputStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: "11px",
  textAlign: "center",
  padding: "2px 0",
  color: ink,
}

type Props = {
  surveyRows1: MetersSurveyMeasureRow[]
  surveyRows2: MetersSurveyMeasureRow[]
  prices: Record<MetersSurveyPriceKey, string>
  magnetMeters: string
  clientName: string
  clientLocation: string
  paid: string
  /** When set (e.g. data URL from fetch), logos render in html2canvas/print; otherwise default URL (fine in browser only). */
  logoSrcOverride?: string
  readOnly?: boolean
  onSurveyCellChange1?: (id: string, key: keyof Omit<MetersSurveyMeasureRow, "id">, value: string) => void
  onAddSurveyRow1?: () => void
  onRemoveSurveyRow1?: (id: string) => void
  onSurveyCellChange2?: (id: string, key: keyof Omit<MetersSurveyMeasureRow, "id">, value: string) => void
  onAddSurveyRow2?: () => void
  onRemoveSurveyRow2?: (id: string) => void
  onPriceChange?: (k: MetersSurveyPriceKey, v: string) => void
  onMagnetMeters?: (v: string) => void
  onPaid?: (v: string) => void
}

export const MetersSurveySheet = forwardRef<HTMLDivElement, Props>(function MetersSurveySheet(
  {
    surveyRows1,
    surveyRows2,
    prices,
    magnetMeters,
    clientName,
    clientLocation,
    paid,
    logoSrcOverride,
    readOnly,
    onSurveyCellChange1,
    onAddSurveyRow1,
    onRemoveSurveyRow1,
    onSurveyCellChange2,
    onAddSurveyRow2,
    onRemoveSurveyRow2,
    onPriceChange,
    onMagnetMeters,
    onPaid,
  },
  ref,
) {
  const logoSrc = logoSrcOverride?.trim() ? logoSrcOverride : logoSrcDefault()
  const totals = surveyColumnTotals(surveyRows1, surveyRows2)
  const metersFor = (k: MetersSurveyPriceKey): number => {
    if (k === "white_linear") return totals.linear
    if (k === "white_square") return totals.square
    if (k === "processed") return totals.processed
    if (k === "shadow") return totals.shadowLight
    return parseMoneyLike(magnetMeters)
  }

  const priceKeys = Object.keys(METERS_SURVEY_PRICE_LABELS) as MetersSurveyPriceKey[]
  let grand = 0
  for (const k of priceKeys) {
    const m = metersFor(k)
    const p = parseMoneyLike(prices[k])
    grand += m * p
  }
  const paidNum = parseMoneyLike(paid)
  const remaining = grand - paidNum

  const th = (text: string, colSpan = 1) => (
    <th
      colSpan={colSpan}
      style={{
        border: `1px solid ${border}`,
        backgroundColor: headerBg,
        fontWeight: 700,
        fontSize: "11px",
        padding: cellPad,
        textAlign: "center",
        color: ink,
      }}
    >
      {text}
    </th>
  )

  const td = (children: React.ReactNode, extra: CSSProperties = {}) => (
    <td
      style={{
        border: `1px solid ${border}`,
        padding: cellPad,
        fontSize: "11px",
        verticalAlign: "middle",
        ...extra,
      }}
    >
      {children}
    </td>
  )

  return (
    <div
      ref={ref}
      dir="rtl"
      lang="ar"
      data-meters-survey-sheet
      style={{
        width: 794,
        maxWidth: "100%",
        boxSizing: "border-box",
        fontFamily: fontFamilyAr,
        fontSize: "11px",
        lineHeight: 1.35,
        color: ink,
        backgroundColor: "#ffffff",
        padding: "14px 16px 20px",
      }}
    >
      {/* Header logos + title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <img src={logoSrc} alt="" style={{ height: 44, width: "auto", objectFit: "contain" }} />
        <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "0.02em" }}>حصر امتار</div>
        <img src={logoSrc} alt="" style={{ height: 44, width: "auto", objectFit: "contain" }} />
      </div>

      {/* Table 1 */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          marginBottom: "12px",
        }}
      >
        <thead>
          <tr>
            {th("المكان")}
            {th("المساحات")}
            {th("المساحات")}
            {th("طولي")}
            {th("شادو لايت")}
            {!readOnly && (
              <th
                className="print-hide"
                style={{
                  border: `1px solid ${border}`,
                  width: 36,
                  backgroundColor: headerBg,
                }}
              />
            )}
          </tr>
        </thead>
        <tbody>
          {surveyRows1.map((row) => {
            return (
              <tr key={row.id}>
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={{ ...inputStyle, textAlign: "right" }}
                    value={row.place}
                    onChange={(e) => onSurveyCellChange1?.(row.id, "place", e.target.value)}
                  />,
                  { textAlign: "right" },
                )}
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={inputStyle}
                    value={row.dimA}
                    onChange={(e) => onSurveyCellChange1?.(row.id, "dimA", e.target.value)}
                    dir="ltr"
                  />,
                )}
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={inputStyle}
                    value={row.dimB}
                    onChange={(e) => onSurveyCellChange1?.(row.id, "dimB", e.target.value)}
                    dir="ltr"
                  />,
                )}
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={inputStyle}
                    value={row.linear}
                    onChange={(e) => onSurveyCellChange1?.(row.id, "linear", e.target.value)}
                    dir="ltr"
                  />,
                )}
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={inputStyle}
                    value={row.shadowLight}
                    onChange={(e) => onSurveyCellChange1?.(row.id, "shadowLight", e.target.value)}
                    dir="ltr"
                  />,
                )}
                {!readOnly && td(
                  surveyRows1.length > 1 ? (
                    <button
                      type="button"
                      className="print-hide"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontSize: "12px",
                        padding: 0,
                        width: "100%",
                      }}
                      onClick={() => onRemoveSurveyRow1?.(row.id)}
                      aria-label="حذف الصف"
                    >
                      ×
                    </button>
                  ) : (
                    <span />
                  ),
                  { textAlign: "center", width: 36, padding: "0" },
                )}
              </tr>
            )
          })}
          <tr style={{ backgroundColor: "#f1f5f9" }}>
            <td
              colSpan={3}
              style={{
                border: `1px solid ${border}`,
                padding: cellPad,
                fontWeight: 800,
                fontSize: "11px",
                textAlign: "center",
              }}
            >
              المجموع
            </td>
            <td style={{ border: `1px solid ${border}`, padding: cellPad, textAlign: "center", fontWeight: 700 }} dir="ltr">
              {formatSurveyNumber(totals.linear)}
            </td>
            <td style={{ border: `1px solid ${border}`, padding: cellPad, textAlign: "center", fontWeight: 700 }} dir="ltr">
              {formatSurveyNumber(totals.shadowLight)}
            </td>
            {!readOnly && <td className="print-hide" style={{ border: `1px solid ${border}`, padding: cellPad }} />}
          </tr>
        </tbody>
      </table>

      {!readOnly && (
        <div className="print-hide" style={{ marginBottom: "24px", textAlign: "start" }}>
          <button
            type="button"
            onClick={() => onAddSurveyRow1?.()}
            style={{
              fontSize: "11px",
              padding: "4px 10px",
              borderRadius: "6px",
              border: `1px solid ${border}`,
              background: "#f8fafc",
              cursor: "pointer",
            }}
          >
            إضافة صف
          </button>
        </div>
      )}

      {/* Table 2 - المعالج */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          marginBottom: "12px",
        }}
      >
        <thead>
          <tr>
            {th("المكان")}
            {th("المساحات")}
            {th("المساحات")}
            {th("المعالج")}
            {!readOnly && (
              <th
                className="print-hide"
                style={{
                  border: `1px solid ${border}`,
                  width: 36,
                  backgroundColor: headerBg,
                }}
              />
            )}
          </tr>
        </thead>
        <tbody>
          {surveyRows2.map((row) => {
            const proc = computedProcessedCell(row.dimA, row.dimB)
            return (
              <tr key={row.id}>
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={{ ...inputStyle, textAlign: "right" }}
                    value={row.place}
                    onChange={(e) => onSurveyCellChange2?.(row.id, "place", e.target.value)}
                  />,
                  { textAlign: "right" },
                )}
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={inputStyle}
                    value={row.dimA}
                    onChange={(e) => onSurveyCellChange2?.(row.id, "dimA", e.target.value)}
                    dir="ltr"
                  />,
                )}
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={inputStyle}
                    value={row.dimB}
                    onChange={(e) => onSurveyCellChange2?.(row.id, "dimB", e.target.value)}
                    dir="ltr"
                  />,
                )}
                {td(
                  <span style={{ display: "block", textAlign: "center", fontWeight: 600 }} dir="ltr">
                    {proc}
                  </span>,
                )}
                {!readOnly && td(
                  surveyRows2.length > 1 ? (
                    <button
                      type="button"
                      className="print-hide"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontSize: "12px",
                        padding: 0,
                        width: "100%",
                      }}
                      onClick={() => onRemoveSurveyRow2?.(row.id)}
                      aria-label="حذف الصف"
                    >
                      ×
                    </button>
                  ) : (
                    <span />
                  ),
                  { textAlign: "center", width: 36 },
                )}
              </tr>
            )
          })}
          <tr style={{ backgroundColor: "#f1f5f9" }}>
            <td
              colSpan={3}
              style={{
                border: `1px solid ${border}`,
                padding: cellPad,
                fontWeight: 800,
                fontSize: "11px",
                textAlign: "center",
              }}
            >
              المجموع
            </td>
            <td style={{ border: `1px solid ${border}`, padding: cellPad, textAlign: "center", fontWeight: 700 }} dir="ltr">
              {formatSurveyNumber(totals.processed)}
            </td>
            {!readOnly && <td className="print-hide" style={{ border: `1px solid ${border}`, padding: cellPad }} />}
          </tr>
        </tbody>
      </table>

      {!readOnly && (
        <div className="print-hide" style={{ marginBottom: "24px", textAlign: "start" }}>
          <button
            type="button"
            onClick={() => onAddSurveyRow2?.()}
            style={{
              fontSize: "11px",
              padding: "4px 10px",
              borderRadius: "6px",
              border: `1px solid ${border}`,
              background: "#f8fafc",
              cursor: "pointer",
            }}
          >
            إضافة صف
          </button>
        </div>
      )}

      {/* Table 3 (Prices) */}
      <table style={{ width: "72%", marginInlineStart: "auto", borderCollapse: "collapse", marginBottom: "12px" }}>
        <thead>
          <tr>
            {th("البيان")}
            {th("الامتار")}
            {th("السعر")}
            {th("الاجمالي")}
          </tr>
        </thead>
        <tbody>
          {priceKeys.map((k) => {
            const m = metersFor(k)
            const p = parseMoneyLike(prices[k])
            const line = m * p
            return (
              <tr key={k}>
                {td(METERS_SURVEY_PRICE_LABELS[k], { fontWeight: 600 })}
                {td(
                  k === "magnet" ? (
                    <input
                      readOnly={readOnly}
                      disabled={readOnly}
                      style={inputStyle}
                      value={magnetMeters}
                      onChange={(e) => onMagnetMeters?.(e.target.value)}
                      dir="ltr"
                    />
                  ) : (
                    <span style={{ display: "block", textAlign: "center" }} dir="ltr">
                      {formatSurveyNumber(m)}
                    </span>
                  ),
                  { textAlign: "center" },
                )}
                {td(
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    style={inputStyle}
                    value={prices[k]}
                    onChange={(e) => onPriceChange?.(k, e.target.value)}
                    dir="ltr"
                  />,
                )}
                {td(
                  <span style={{ display: "block", textAlign: "center", fontWeight: 600 }} dir="ltr">
                    {formatSurveyNumber(line)}
                  </span>,
                  { textAlign: "center" },
                )}
              </tr>
            )
          })}
          <tr style={{ backgroundColor: "#f1f5f9" }}>
            <td
              colSpan={3}
              style={{
                border: `1px solid ${border}`,
                padding: cellPad,
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              الاجمالي
            </td>
            <td style={{ border: `1px solid ${border}`, padding: cellPad, textAlign: "center", fontWeight: 800 }} dir="ltr">
              {formatSurveyNumber(grand)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "14px",
          border: `1px solid ${border}`,
          padding: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: muted, marginBottom: "4px" }}>الاجمالي</div>
          <div style={{ fontWeight: 800 }} dir="ltr">
            {formatSurveyNumber(grand)}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: muted, marginBottom: "4px" }}>واصل</div>
          <input
            readOnly={readOnly}
            disabled={readOnly}
            style={{ ...inputStyle, fontWeight: 700 }}
            value={paid}
            onChange={(e) => onPaid?.(e.target.value)}
            dir="ltr"
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: muted, marginBottom: "4px" }}>المتبقي</div>
          <div style={{ fontWeight: 800 }} dir="ltr">
            {formatSurveyNumber(remaining)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "12px",
          borderTop: `1px solid ${border}`,
          paddingTop: "10px",
          fontSize: "10px",
          lineHeight: 1.5,
        }}
      >
        <div style={{ textAlign: "center", flex: "1 1 40%" }}>
          <div style={{ fontWeight: 800, fontSize: "12px" }}>{clientName || "\u00a0"}</div>
          <div style={{ color: muted }}>{clientLocation || "\u00a0"}</div>
        </div>
        <div style={{ textAlign: "right", flex: "1 1 55%", color: ink, fontSize: "9px" }}>
          <div>العنوان / العاشر من رمضان مجاورة 11 بجوار معرض الحصري</div>
          <div>للاستفسار والتواصل/ 01013038360 / 01067655355</div>
        </div>
      </div>
    </div>
  )
})
