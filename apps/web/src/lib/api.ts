export type Role = "admin" | "worker"

export type AuthUser = {
  id: string
  name: string
  email: string
  role: Role
}

export type User = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export type Product = {
  id: string
  name: string
  buyPrice: string
  sellPriceInside: string
  sellPriceOutside: string
  defaultSellType: "inside" | "outside"
  quantity: number
}

export type Visit = {
  id: string
  customerName: string
  address: string
  phone: string
  status: "done" | "pending" | "fail"
  visitDate: string
  workGroupId?: string | null
  workGroup?: { id: string; name: string } | null
}

export type WorkGroup = {
  id: string
  name: string
}

export type SellingTransaction = {
  id: string
  money: string
  type: "pay" | "get"
  date: string
  reason: string
}

export type InventoryTransaction = {
  id: string
  type: "inside" | "outside"
  totalSell: string
  totalBuyCost: string
  benefit: string
  createdAt?: string
  items?: Array<{
    id: string
    productId: string
    quantity: number
    unitSellPrice: string
    unitBuyPrice: string
    lineSellTotal: string
    lineBuyTotal: string
    lineBenefit: string
  }>
}

export type InvoiceHistoryEntry = {
  id: string
  type: "inside" | "outside"
  totalSell: string
  totalBuyCost: string
  benefit: string
  createdAt: string
  visit: {
    id: string
    customerName: string
    address: string
    phone: string
    workGroup?: { id: string; name: string } | null
  }
  items: Array<{
    id: string
    productId: string
    quantity: number
    unitSellPrice: string
    unitBuyPrice: string
    lineSellTotal: string
    lineBuyTotal: string
    lineBenefit: string
    product: { id: string; name: string }
  }>
}

export type ReturnEntry = {
  id: string
  createdAt?: string
  reason: string
  quantity: number
  totalRefundValue: string
  product: { name: string }
}

export type HistoryEntry = {
  id: string
  action: string
  entity: string
  entityId?: string
  details?: unknown
  createdAt: string
  user: { id: string; name: string; email: string; role: Role }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"

async function request<T>(path: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "Request failed")
  }

  return (await response.json()) as T
}

export async function login(email: string, password: string) {
  return request<{ accessToken: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function getMe(token: string) {
  return request<AuthUser>("/auth/me", {}, token)
}

export async function getProducts(token: string) {
  return request<Product[]>("/products", {}, token)
}

export async function createProduct(
  token: string,
  payload: {
    name: string
    buyPrice: number
    sellPriceInside: number
    sellPriceOutside: number
    defaultSellType: "inside" | "outside"
    quantity: number
  }
) {
  return request<Product>(
    "/products",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function updateProduct(
  token: string,
  productId: string,
  payload: {
    name?: string
    buyPrice?: number
    sellPriceInside?: number
    sellPriceOutside?: number
    quantity?: number
  }
) {
  return request<Product>(
    `/products/${productId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  )
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type GetVisitsParams = {
  page?: number
  limit?: number
  status?: "pending" | "done" | "fail" | "all"
  workGroupId?: string
  q?: string
}

export async function getVisits(token: string, params?: GetVisitsParams) {
  const search = new URLSearchParams()
  if (params?.page != null) search.set("page", String(params.page))
  if (params?.limit != null) search.set("limit", String(params.limit))
  if (params?.status && params.status !== "all") search.set("status", params.status)
  if (params?.workGroupId && params.workGroupId !== "all") {
    search.set("workGroupId", params.workGroupId)
  }
  if (params?.q?.trim()) search.set("q", params.q.trim())
  const qs = search.toString()
  const raw = await request<unknown>(`/visits${qs ? `?${qs}` : ""}`, {}, token)

  const page = params?.page ?? 1
  const limit = params?.limit ?? 20

  if (Array.isArray(raw)) {
    const data = raw as Visit[]
    return {
      data,
      total: data.length,
      page,
      limit,
      totalPages: limit > 0 ? Math.max(1, Math.ceil(data.length / limit)) : 0,
    }
  }

  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as PaginatedResponse<Visit>).data)
  ) {
    const r = raw as PaginatedResponse<Visit>
    return {
      data: r.data,
      total: r.total,
      page: r.page ?? page,
      limit: r.limit ?? limit,
      totalPages: r.totalPages,
    }
  }

  return {
    data: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  }
}

export async function updateVisitStatus(
  token: string,
  visitId: string,
  status: "done" | "pending" | "fail"
) {
  return request<Visit>(
    `/visits/${visitId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    token
  )
}

export async function updateVisitWorkGroup(
  token: string,
  visitId: string,
  workGroupId: string
) {
  return request<Visit>(
    `/visits/${visitId}/work-group`,
    {
      method: "PATCH",
      body: JSON.stringify({ workGroupId }),
    },
    token
  )
}

export async function createVisit(
  token: string,
  payload: {
    visitDate: string
    address: string
    customerName: string
    phone: string
    workType: "board" | "epoxy"
    workGroupId: string
  }
) {
  return request<Visit>(
    "/visits",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function getWorkGroups(token: string) {
  return request<WorkGroup[]>("/work-groups", {}, token)
}

export async function createWorkGroup(token: string, payload: { name: string }) {
  return request<WorkGroup>(
    "/work-groups",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function getSellingTransactions(token: string, visitId: string) {
  return request<SellingTransaction[]>(
    `/visits/${visitId}/selling-transactions`,
    {},
    token
  )
}

export async function createSellingTransaction(
  token: string,
  visitId: string,
  payload: { money: number; type: "pay" | "get"; date: string; reason: string }
) {
  return request<SellingTransaction>(
    `/visits/${visitId}/selling-transactions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function getInventoryTransactions(token: string, visitId: string) {
  return request<InventoryTransaction[]>(
    `/visits/${visitId}/inventory-transactions`,
    {},
    token
  )
}

export type GetInvoicesHistoryParams = {
  page?: number
  limit?: number
  type?: "all" | "inside" | "outside"
  q?: string
}

export async function getInvoicesHistory(token: string, params?: GetInvoicesHistoryParams) {
  const search = new URLSearchParams()
  if (params?.page != null) search.set("page", String(params.page))
  if (params?.limit != null) search.set("limit", String(params.limit))
  if (params?.type && params.type !== "all") search.set("type", params.type)
  if (params?.q?.trim()) search.set("q", params.q.trim())
  const qs = search.toString()
  const raw = await request<unknown>(
    `/inventory-transactions${qs ? `?${qs}` : ""}`,
    {},
    token,
  )

  const page = params?.page ?? 1
  const limit = params?.limit ?? 20

  if (Array.isArray(raw)) {
    const data = raw as InvoiceHistoryEntry[]
    return {
      data,
      total: data.length,
      page,
      limit,
      totalPages: limit > 0 ? Math.max(1, Math.ceil(data.length / limit)) : 0,
    }
  }

  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as PaginatedResponse<InvoiceHistoryEntry>).data)
  ) {
    const r = raw as PaginatedResponse<InvoiceHistoryEntry>
    return {
      data: r.data,
      total: r.total,
      page: r.page ?? page,
      limit: r.limit ?? limit,
      totalPages: r.totalPages,
    }
  }

  return {
    data: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  }
}

export async function createInventoryTransaction(
  token: string,
  visitId: string,
  payload: {
    type: "inside" | "outside"
    items: Array<{ productId: string; quantity: number; unitSellPrice?: number }>
  }
) {
  return request<InventoryTransaction>(
    `/visits/${visitId}/inventory-transactions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function createOutsideInvoice(
  token: string,
  payload: {
    customerName: string
    address?: string
    phone: string
    items: Array<{ productId: string; quantity: number }>
  }
) {
  return request<{ id: string }>(
    "/inventory-transactions/outside-invoice",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export type StatisticsPreset = "7d" | "30d" | "90d" | "365d" | "all" | "custom"

export type DashboardStatistics = {
  preset: string
  range: { from: string | null; to: string | null }
  global: { currentMoney: number; stockValue: number }
  kpis: {
    visitsTotal: number
    doneVisits: number
    pendingVisits: number
    failedVisits: number
    completionRate: number
    cashIn: number
    cashOut: number
    netCash: number
    returnsCount: number
  }
  statusBreakdown: { done: number; pending: number; fail: number }
  visitsByDay: { day: string; count: number }[]
  cashFlowByDay: { day: string; cashIn: number; cashOut: number; net: number }[]
  topCustomers: { name: string; visitsCount: number }[]
  topReturns: { name: string; quantity: number }[]
  topSoldProducts: { name: string; quantity: number }[]
}

export async function getStatistics(
  token: string,
  params: { preset: StatisticsPreset; from?: string; to?: string }
) {
  const search = new URLSearchParams()
  search.set("preset", params.preset)
  if (params.preset === "custom") {
    if (params.from) search.set("from", params.from)
    if (params.to) search.set("to", params.to)
  }
  return request<DashboardStatistics>(`/statistics?${search.toString()}`, {}, token)
}

export type GetReturnsParams = {
  page?: number
  limit?: number
  q?: string
}

export async function getReturns(token: string, params?: GetReturnsParams) {
  const search = new URLSearchParams()
  if (params?.page != null) search.set("page", String(params.page))
  if (params?.limit != null) search.set("limit", String(params.limit))
  if (params?.q?.trim()) search.set("q", params.q.trim())
  const qs = search.toString()
  const raw = await request<unknown>(`/returns${qs ? `?${qs}` : ""}`, {}, token)

  const page = params?.page ?? 1
  const limit = params?.limit ?? 20

  if (Array.isArray(raw)) {
    const data = raw as ReturnEntry[]
    return {
      data,
      total: data.length,
      page,
      limit,
      totalPages: limit > 0 ? Math.max(1, Math.ceil(data.length / limit)) : 0,
    }
  }

  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as PaginatedResponse<ReturnEntry>).data)
  ) {
    const r = raw as PaginatedResponse<ReturnEntry>
    return {
      data: r.data,
      total: r.total,
      page: r.page ?? page,
      limit: r.limit ?? limit,
      totalPages: r.totalPages,
    }
  }

  return {
    data: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  }
}

export async function createReturn(
  token: string,
  payload: {
    priceType: "inside" | "outside"
    items: Array<{ productId: string; quantity: number }>
    reason: string
  }
) {
  return request<ReturnEntry[]>(
    "/returns",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function getInventoryMoney(token: string) {
  return request<{ currentMoney: number | string }>("/inventory/money", {}, token)
}

export async function getUsers(token: string) {
  return request<User[]>("/users", {}, token)
}

export type GetHistoryParams = {
  page?: number
  limit?: number
  q?: string
}

export async function getHistory(token: string, params?: GetHistoryParams) {
  const search = new URLSearchParams()
  if (params?.page != null) search.set("page", String(params.page))
  if (params?.limit != null) search.set("limit", String(params.limit))
  if (params?.q?.trim()) search.set("q", params.q.trim())
  const qs = search.toString()
  return request<PaginatedResponse<HistoryEntry>>(`/history${qs ? `?${qs}` : ""}`, {}, token)
}

export async function createUser(
  token: string,
  payload: { name: string; email: string; password: string }
) {
  return request<User>(
    "/users",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function updateUser(
  token: string,
  userId: string,
  payload: { name?: string; email?: string; password?: string }
) {
  return request<User>(
    `/users/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function deleteUser(token: string, userId: string) {
  return request<{ ok: boolean }>(
    `/users/${userId}`,
    {
      method: "DELETE",
    },
    token
  )
}
