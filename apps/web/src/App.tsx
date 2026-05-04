import { Navigate, Route, Routes } from "react-router-dom"
import { useEffect, useState } from "react"
import { getMe } from "@/lib/api"
import type { AuthUser } from "@/lib/api"
import { AppShell } from "@/components/AppShell"
import { LoginPage } from "@/pages/LoginPage"

const AUTH_STORAGE_KEY = "authToken"

export function App() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(AUTH_STORAGE_KEY) ?? null
  )
  const [user, setUser] = useState<AuthUser | null>(null)
  /**
   * If there is a stored token on first paint, we must not redirect to login until
   * `getMe` resolves — otherwise `user` is still null and the session looks logged out.
   * No stored token → ready immediately (show login).
   */
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

  return (
    <Routes>
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
