import type { InvoiceHistoryEntry } from "@/lib/api"
import { fontFamilyAr, localeAr } from "@/lib/ui-ar"
import type { CSSProperties } from "react"

/** KNOZ navy + paper + subtle gold. Compact layout for PDF/PNG to leave more room for line items. */
const ink = "#0f172a"
const inkMuted = "#334155"
const muted = "#64748b"
const border = "#e2e8f0"
const borderLight = "#f1f5f9"
const accent = "#1a2744"
const theadBg = "#152032"
const accentSoft = "#eef1f7"
const rowAlt = "#f8fafc"
const gold = "#b45309"
const goldSoft = "#fffbeb"
const paperEdge = "#dce3eb"

const labelStyle: CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  color: muted,
  letterSpacing: "0.02em",
  marginBottom: "2px",
}

const valueStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: ink,
  lineHeight: 1.3,
}

function SectionRule({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "6px",
      }}
    >
      <div
        style={{
          width: "3px",
          height: "14px",
          backgroundColor: accent,
          borderRadius: "1px",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: "10px",
          fontWeight: 800,
          color: accent,
          letterSpacing: "0.02em",
        }}
      >
        {title}
      </span>
      <div style={{ flex: 1, height: "1px", backgroundColor: border, minWidth: "16px" }} />
    </div>
  )
}

export function InvoiceReceipt({
  invoice,
  logoSrc,
}: {
  invoice: InvoiceHistoryEntry
  logoSrc: string
}) {
  const dateStr = new Date(invoice.createdAt).toLocaleString(localeAr)
  const lines = invoice.items ?? []

  return (
    <div
      data-invoice-receipt
      dir="rtl"
      style={{
        boxSizing: "border-box",
        width: "794px",
        maxWidth: "100%",
        backgroundColor: "#ffffff",
        color: ink,
        fontFamily: fontFamilyAr,
        fontSize: "12px",
        lineHeight: 1.35,
        border: `1px solid ${paperEdge}`,
        borderRadius: "2px",
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ width: "100%" }}>
        <div style={{ height: "3px", backgroundColor: accent, width: "100%" }} />
        <div style={{ height: "1px", backgroundColor: gold, width: "100%" }} />
      </div>

      <div style={{ padding: "12px 16px 12px" }}>
        {/* Title — compact */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "10px",
            paddingBottom: "8px",
            borderBottom: `1px solid ${border}`,
          }}
        >
          <div
            style={{
              fontSize: "8px",
              fontWeight: 700,
              color: gold,
              letterSpacing: "0.1em",
              marginBottom: "3px",
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            KNOZ · SALES INVOICE
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: ink,
              letterSpacing: "-0.02em",
              marginBottom: "2px",
              lineHeight: 1.1,
            }}
          >
            فاتورة بيع
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "9px",
              color: muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {dateStr}
          </div>
        </div>

        {/* Logo + customer — single compact row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              flex: "0 0 132px",
              width: "132px",
              alignSelf: "stretch",
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${border}`,
              borderRadius: "6px",
              backgroundColor: rowAlt,
              minHeight: "72px",
              boxShadow: `inset 0 0 0 1px ${borderLight}`,
            }}
          >
            <img
              src={logoSrc}
              alt=""
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                objectFit: "fill",
                objectPosition: "center",
                display: "block",
              }}
            />
          </div>

          <div
            style={{
              flex: "1 1 auto",
              textAlign: "right",
              direction: "rtl",
              padding: "0",
              border: `1px solid ${border}`,
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              overflow: "hidden",
              boxShadow: `0 1px 4px rgba(15, 23, 42, 0.04)`,
            }}
          >
            <div
              style={{
                padding: "4px 10px",
                backgroundColor: accentSoft,
                borderBottom: `1px solid ${border}`,
                fontSize: "9px",
                fontWeight: 800,
                color: accent,
                letterSpacing: "0.02em",
              }}
            >
              بيانات العميل
            </div>
            <div style={{ padding: "8px 10px 10px", borderRight: `3px solid ${accent}` }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 12px",
                }}
              >
                <div style={{ paddingBottom: "4px", borderBottom: `1px solid ${borderLight}` }}>
                  <div style={labelStyle}>اسم العميل</div>
                  <div style={valueStyle}>{invoice.visit?.customerName ?? "—"}</div>
                </div>
                <div style={{ paddingBottom: "4px", borderBottom: `1px solid ${borderLight}` }}>
                  <div style={labelStyle}>الهاتف</div>
                  <div dir="ltr" style={{ ...valueStyle, textAlign: "right", unicodeBidi: "plaintext" }}>
                    {invoice.visit?.phone ?? "—"}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={labelStyle}>إنشاء الفاتورة</div>
                  <div style={{ ...valueStyle, fontVariantNumeric: "tabular-nums", color: inkMuted, fontSize: "11px" }}>
                    {dateStr}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SectionRule title={`الأصناف${lines.length ? ` (${lines.length})` : ""}`} />

        <div style={{ marginBottom: "2px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              direction: "rtl",
              fontSize: "11px",
              border: `1px solid ${border}`,
              borderRadius: "6px",
              overflow: "hidden",
              boxShadow: `0 1px 6px rgba(15, 23, 42, 0.04)`,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: theadBg, color: "#f8fafc" }}>
                <th
                  style={{
                    padding: "6px 8px",
                    fontWeight: 700,
                    textAlign: "right",
                    fontSize: "10px",
                    letterSpacing: "0.02em",
                    borderBottom: `1px solid ${gold}`,
                  }}
                >
                  اسم المنتج
                </th>
                <th
                  style={{
                    padding: "6px 6px",
                    fontWeight: 700,
                    textAlign: "center",
                    width: "72px",
                    fontSize: "10px",
                    borderBottom: `1px solid ${gold}`,
                  }}
                >
                  القطع
                </th>
                <th
                  style={{
                    padding: "6px 6px",
                    fontWeight: 700,
                    textAlign: "center",
                    width: "78px",
                    fontSize: "10px",
                    borderBottom: `1px solid ${gold}`,
                  }}
                >
                  السعر
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    fontWeight: 700,
                    textAlign: "center",
                    width: "86px",
                    fontSize: "10px",
                    borderBottom: `1px solid ${gold}`,
                    backgroundColor: "#1e2d42",
                  }}
                >
                  الإجمالي
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "14px 10px",
                      textAlign: "center",
                      color: muted,
                      fontSize: "11px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    لا توجد أصناف في هذه الفاتورة.
                  </td>
                </tr>
              ) : (
                lines.map((line, i) => (
                  <tr
                    key={line.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? "#ffffff" : rowAlt,
                    }}
                  >
                    <td
                      style={{
                        padding: "5px 8px",
                        borderTop: `1px solid ${borderLight}`,
                        fontWeight: 600,
                        color: ink,
                        fontSize: "11px",
                      }}
                    >
                      {line.product.name}
                    </td>
                    <td
                      style={{
                        padding: "5px 6px",
                        borderTop: `1px solid ${borderLight}`,
                        direction: "ltr",
                        textAlign: "center",
                        fontVariantNumeric: "tabular-nums",
                        color: inkMuted,
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      {line.quantity}
                    </td>
                    <td
                      style={{
                        padding: "5px 6px",
                        borderTop: `1px solid ${borderLight}`,
                        direction: "ltr",
                        textAlign: "center",
                        fontVariantNumeric: "tabular-nums",
                        color: inkMuted,
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      {line.unitSellPrice}
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        borderTop: `1px solid ${borderLight}`,
                        direction: "ltr",
                        textAlign: "center",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: ink,
                        fontSize: "11px",
                        backgroundColor: i % 2 === 0 ? goldSoft : "#fff7ed",
                      }}
                    >
                      {line.lineSellTotal}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: accentSoft }}>
                <td
                  colSpan={3}
                  style={{
                    padding: "7px 10px",
                    borderTop: `2px solid ${accent}`,
                    fontWeight: 800,
                    fontSize: "12px",
                    color: ink,
                    textAlign: "left",
                  }}
                >
                  الإجمالي
                </td>
                <td
                  dir="ltr"
                  style={{
                    padding: "7px 10px",
                    borderTop: `2px solid ${accent}`,
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: "14px",
                    fontVariantNumeric: "tabular-nums",
                    color: accent,
                    unicodeBidi: "plaintext",
                    backgroundColor: "#e8edf4",
                  }}
                >
                  {invoice.totalSell}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer — minimal */}
        <div
          style={{
            marginTop: "10px",
            paddingTop: "8px",
            borderTop: `1px solid ${border}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: muted,
              marginBottom: "2px",
              fontWeight: 600,
            }}
          >
            شكراً لتعاملكم معنا · KNOZ
          </div>
          <div
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: "6px",
              backgroundColor: rowAlt,
              border: `1px solid ${border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 700, color: ink, marginBottom: "2px" }}>
              مجاورة 11 بجوار معرض الحصري
            </div>
            <div
              dir="ltr"
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: accent,
                unicodeBidi: "plaintext",
              }}
            >
              01004926224
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
