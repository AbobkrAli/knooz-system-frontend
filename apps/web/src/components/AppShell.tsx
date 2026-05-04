import { Button } from "@workspace/ui/components/button"
import type { AuthUser } from "@/lib/api"
import { DashboardPage } from "@/pages/DashboardPage"
import { HistoryPage } from "@/pages/HistoryPage"
import { InvoicesHistoryPage } from "@/pages/InvoicesHistoryPage"
import { ProductsPage } from "@/pages/ProductsPage"
import { ReturnsPage } from "@/pages/ReturnsPage"
import { UsersPage } from "@/pages/UsersPage"
import { VisitsPage } from "@/pages/VisitsPage"
import { GuaranteeCreatePage } from "@/pages/GuaranteeCreatePage"
import { HasrAmtarCreatePage } from "@/pages/HasrAmtarCreatePage"
import { WorkGroupsPage } from "@/pages/WorkGroupsPage"
import { PopoverForm, PopoverFormBody, PopoverFormButton } from "@/components/PopoverForm"
import {
  ClipboardList,
  LayoutDashboard,
  Settings,
  Users,
  Wrench,
  Boxes,
  RotateCcw,
  History,
  ReceiptText,
  Shield,
  Ruler,
} from "lucide-react"
import { Navigate, NavLink, Route, Routes } from "react-router-dom"
import { useState } from "react"

const navItems = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/guarantee-create", label: "إنشاء ضمان", icon: Shield },
  { to: "/hasr-amtar", label: "إنشاء حصر امتار", icon: Ruler },
  { to: "/current-work", label: "الشغل الحالي", icon: ClipboardList },
  { to: "/visits", label: "المعاينات", icon: Wrench },
  { to: "/products", label: "المخزن", icon: Boxes },
  { to: "/work-groups", label: "مجموعات العمل", icon: Settings },
  { to: "/returns", label: "المرتجعات", icon: RotateCcw },
  { to: "/invoices-history", label: "سجل الفواتير", icon: ReceiptText },
  { to: "/history", label: "السجل", icon: History },
  { to: "/users", label: "المستخدمون", icon: Users },
]

export function AppShell({
  user,
  token,
  onLogout,
}: {
  user: AuthUser
  token: string
  onLogout: () => void
}) {
  const [logoutOpen, setLogoutOpen] = useState(false)
  const visibleNavItems =
    user.role === "admin" ? navItems : navItems.filter((item) => item.to !== "/users")

  return (
    <div className="dashboard-shell min-h-svh bg-background text-slate-800">
      <aside className="sidebar-appear sticky top-0 z-50 flex h-auto w-full flex-col border-b border-slate-100 bg-white py-4 shadow-[0_0_10px_rgba(0,0,0,0.02)] lg:fixed lg:start-0 lg:h-screen lg:w-60 lg:border-e lg:border-b-0 lg:py-6">
        <div className="mb-4 hidden w-full px-4 lg:mb-8 lg:block lg:px-6">
          <img
            src="/logo.png"
            alt="كنوز"
            className="block h-auto w-full max-w-none object-contain object-center"
          />
        </div>

        <nav className="flex-1 overflow-x-auto px-3 pb-2 lg:space-y-1 lg:px-4 lg:pb-0">
          <div className="flex min-w-max items-center gap-2 lg:block lg:min-w-0">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to}>
                {({ isActive }) => (
                  <div
                    className={`hover-lift flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:gap-3 lg:py-2.5 ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </div>
                )}
              </NavLink>
            )
          })}
          </div>
        </nav>

        <div className="mt-2 px-3 lg:mt-auto lg:px-4">
          <div className="w-full">
            <PopoverForm
              title="تسجيل الخروج"
              open={logoutOpen}
              setOpen={setLogoutOpen}
              width="360px"
              height="210px"
              showCloseButton
              showSuccess={false}
              wrapperClassName="flex w-full"
              triggerClassName="w-full justify-center bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-900"
              openChild={
                <form
                  className="flex h-full min-h-0 flex-col"
                  onSubmit={(e) => {
                    e.preventDefault()
                    onLogout()
                  }}
                >
                  <PopoverFormBody
                    footer={
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setLogoutOpen(false)}>
                          إلغاء
                        </Button>
                        <PopoverFormButton loading={false} text="خروج" />
                      </div>
                    }
                  >
                    <div>
                      <p className="mb-1 text-sm font-semibold text-slate-900">تأكيد تسجيل الخروج</p>
                      <p className="text-sm text-muted-foreground">
                        ستحتاج لتسجيل الدخول مجددًا للمتابعة.
                      </p>
                    </div>
                  </PopoverFormBody>
                </form>
              }
            />
          </div>
        </div>
      </aside>

      <div className="flex min-h-svh flex-col lg:ms-60">
        <main className="dashboard-scrollbar content-appear flex-1 overflow-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
          <div className="surface-card hover-lift p-3 sm:p-4 lg:p-6">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage token={token} />} />
              <Route path="/guarantee-create" element={<GuaranteeCreatePage />} />
              <Route path="/hasr-amtar" element={<HasrAmtarCreatePage />} />
              <Route
                path="/current-work"
                element={<VisitsPage token={token} user={user} variant="current-work" />}
              />
              <Route
                path="/visits"
                element={<VisitsPage token={token} user={user} variant="all-visits" />}
              />
              <Route path="/products" element={<ProductsPage token={token} user={user} />} />
              <Route path="/work-groups" element={<WorkGroupsPage token={token} user={user} />} />
              <Route path="/returns" element={<ReturnsPage token={token} user={user} />} />
              <Route path="/invoices-history" element={<InvoicesHistoryPage token={token} />} />
              <Route path="/history" element={<HistoryPage token={token} />} />
              <Route
                path="/users"
                element={user.role === "admin" ? <UsersPage token={token} /> : <Navigate to="/dashboard" replace />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
