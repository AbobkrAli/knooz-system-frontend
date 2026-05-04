/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

type ThemeProviderProps = {
  children: React.ReactNode
}

/** App uses light theme only; OS dark mode is ignored. */
export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark")
    root.classList.add("light")
    root.style.colorScheme = "light"
  }, [])

  return <>{children}</>
}

export const useTheme = () => ({
  theme: "light" as const,
  setTheme: () => {
    /* theme is fixed to light */
  },
})
