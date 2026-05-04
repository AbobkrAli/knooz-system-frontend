export type GuaranteeCertificateData = {
  warrantyStart: string
  warrantyEnd: string
  deliveredItem: string
  deliveryDate: string
  customerName: string
  apartmentNo: string
  floor: string
  area: string
  city: string
  street: string
  gypsumType: string
  sheetMetal: string
  hangingSystem: string
  jointingCompound: string
  meshMetal: string
  metersLinear: string
  metersSquare: string
  metersTreated: string
  countRoom: string
  countReception: string
  countCorridor: string
  countBathroom: string
  countKitchen: string
  countOther: string
  priceWhiteLinear: string
  priceWhiteSquare: string
  priceTreatedLinear: string
  priceTreatedSquare: string
  technicianSignature: string
}

export const defaultGuaranteeCertificateData: GuaranteeCertificateData = {
  warrantyStart: "",
  warrantyEnd: "",
  deliveredItem: "",
  deliveryDate: "",
  customerName: "",
  apartmentNo: "",
  floor: "",
  area: "",
  city: "",
  street: "",
  gypsumType: "",
  sheetMetal: "",
  hangingSystem: "",
  jointingCompound: "",
  meshMetal: "",
  metersLinear: "",
  metersSquare: "",
  metersTreated: "",
  countRoom: "",
  countReception: "",
  countCorridor: "",
  countBathroom: "",
  countKitchen: "",
  countOther: "",
  priceWhiteLinear: "",
  priceWhiteSquare: "",
  priceTreatedLinear: "",
  priceTreatedSquare: "",
  technicianSignature: "",
}

export function splitIsoDate(iso: string): { d: string; m: string; y: string } {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { d: "", m: "", y: "" }
  }
  const [y, m, d] = iso.split("-")
  return { d, m, y }
}

export function displayField(value: string): string {
  return value.trim()
}
