import { useEffect, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/AppShell"
import type { AuthUser } from "@/lib/api"
import { getMe } from "@/lib/api"
import { LoginPage } from "@/pages/LoginPage"
import { FaqPage, FreeSurveyPage, LandingPage, PrivacyPage, ServiceDetailPage, SitemapPage } from "@/pages/LandingPage"
import { allServices } from "@/pages/epoxySiteData"

const AUTH_STORAGE_KEY = "authToken"

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_STORAGE_KEY) ?? null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authReady, setAuthReady] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) == null)

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    getMe(token)
      .then((me) => {
        if (!cancelled) {
          setUser(me)
          setAuthReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          setToken(null)
          setUser(null)
          setAuthReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const publicRoutes = [
    { path: "/faq", element: <FaqPage /> },
    { path: "/privacy", element: <PrivacyPage /> },
    { path: "/sitemap", element: <SitemapPage /> },
    { path: "/free-survey", element: <FreeSurveyPage /> },
  ]

  return (
    <Routes>
      <Route
        path="/"
        element={
          !authReady && token ? (
            <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
              جاري التحقق من الجلسة…
            </div>
          ) : authReady && token && user ? (
            <Navigate to={user.role === "admin" ? "/dashboard" : "/current-work"} replace />
          ) : (
            <LandingPage />
          )
        }
      />

      <Route
        path="/login"
        element={
          !authReady && token ? (
            <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
              جاري التحقق من الجلسة…
            </div>
          ) : authReady && token && user ? (
            <Navigate to={user.role === "admin" ? "/dashboard" : "/current-work"} replace />
          ) : (
            <LoginPage
              onLogin={({ token: nextToken, user: nextUser }) => {
                localStorage.setItem(AUTH_STORAGE_KEY, nextToken)
                setToken(nextToken)
                setUser(nextUser)
              }}
            />
          )
        }
      />

      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {allServices.map((service) => (
        <Route key={service.path} path={service.path} element={<ServiceDetailPage service={service} />} />
      ))}

      <Route
        path="/*"
        element={
          !authReady ? (
            <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
              جاري التحقق من الجلسة…
            </div>
          ) : user && token ? (
            <AppShell
              user={user}
              token={token}
              onLogout={() => {
                localStorage.removeItem(AUTH_STORAGE_KEY)
                setToken(null)
                setUser(null)
                setAuthReady(true)
              }}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}
