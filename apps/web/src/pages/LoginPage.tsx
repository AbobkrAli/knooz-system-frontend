import { Button } from "@workspace/ui/components/button"
import { login } from "@/lib/api"
import type { AuthUser } from "@/lib/api"
import { err } from "@/lib/ui-ar"
import type { FormEvent } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export function LoginPage({
  onLogin,
}: {
  onLogin: (payload: { token: string; user: AuthUser }) => void
}) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("admin@knooz.local")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await login(email, password)
      onLogin({ token: result.accessToken, user: result.user })
      navigate("/dashboard")
    } catch {
      setError(err.login)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">نظام كنوز</h1>
      <p className="text-muted-foreground">سجّل الدخول بحسابك المعتمد في الخادم.</p>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-xs font-medium text-foreground">
            البريد الإلكتروني
          </label>
          <input
            id="login-email"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className="text-xs font-medium text-foreground">
            كلمة المرور
          </label>
          <input
            id="login-password"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
          />
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button disabled={loading} type="submit">
          {loading ? "جاري الدخول…" : "دخول"}
        </Button>
      </form>
    </div>
  )
}
