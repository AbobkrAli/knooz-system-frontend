import { localeAr } from "@/lib/ui-ar"

export type MetersSurveyMeasureRow = {
  id: string
  place: string
  dimA: string
  dimB: string
  square: string
  linear: string
  shadowLight: string
}

export type MetersSurveyPriceKey = "white_linear" | "white_square" | "processed" | "shadow" | "magnet"

export function emptyPriceRow(): Record<MetersSurveyPriceKey, string> {
  return {
    white_linear: "",
    white_square: "",
    processed: "",
    shadow: "",
    magnet: "",
  }
}

export const METERS_SURVEY_PRICE_LABELS: Record<MetersSurveyPriceKey, string> = {
  white_linear: "طولي ابيض",
  white_square: "مربع ابيض",
  processed: "معالج",
  shadow: "شادو لايت",
  magnet: "تركيب مجنتك",
}

export function newSurveyRow(): MetersSurveyMeasureRow {
  return {
    id: crypto.randomUUID(),
    place: "",
    dimA: "",
    dimB: "",
    square: "",
    linear: "",
    shadowLight: "",
  }
}

export function parseSurveyNumber(raw: string): number | null {
  const t = raw.trim().replace(/,/g, ".")
  if (t === "") return null
  const n = Number.parseFloat(t)
  return Number.isFinite(n) ? n : null
}

/** معالج = المساحات × المساحات when both exist; otherwise empty. */
export function computedProcessedCell(dimA: string, dimB: string): string {
  if (!dimA.trim() || !dimB.trim()) return ""
  const a = parseSurveyNumber(dimA)
  const b = parseSurveyNumber(dimB)
  if (a === null || b === null) return ""
  return formatSurveyNumber(a * b)
}

export function formatSurveyNumber(n: number): string {
  return n.toLocaleString(localeAr, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}

function sumNumericStrings(rows: MetersSurveyMeasureRow[], pick: (r: MetersSurveyMeasureRow) => string): number {
  let s = 0
  for (const r of rows) {
    const v = parseSurveyNumber(pick(r))
    if (v !== null) s += v
  }
  return s
}

export function sumProcessedColumn(rows: MetersSurveyMeasureRow[]): number {
  let s = 0
  for (const r of rows) {
    const t = computedProcessedCell(r.dimA, r.dimB)
    const v = parseSurveyNumber(t)
    if (v !== null) s += v
  }
  return s
}

export function surveyColumnTotals(rows1: MetersSurveyMeasureRow[], rows2: MetersSurveyMeasureRow[]) {
  return {
    square: sumNumericStrings(rows1, (r) => r.square),
    linear: sumNumericStrings(rows1, (r) => r.linear),
    shadowLight: sumNumericStrings(rows1, (r) => r.shadowLight),
    processed: sumProcessedColumn(rows2),
  }
}

export function parseMoneyLike(raw: string): number {
  const v = parseSurveyNumber(raw)
  return v === null ? 0 : v
}
