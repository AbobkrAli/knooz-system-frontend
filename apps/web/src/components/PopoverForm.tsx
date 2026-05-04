"use client"

import { useId, useRef, useSyncExternalStore } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { ChevronUp, Loader } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

/** Shared class for inputs and selects inside popover forms */
export const popoverFormControlClass =
  "w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/** Modal open: smooth ease (no blur / layout animation). */
const modalOverlayEnter =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:fill-mode-both motion-safe:duration-320 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"

const modalPanelEnter =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-[0.97] motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-[420ms] motion-safe:delay-[40ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"

type PopoverFormProps = {
  open: boolean
  setOpen: (open: boolean) => void
  openChild?: ReactNode
  successChild?: ReactNode
  showSuccess: boolean
  width?: string
  /** Minimum height; content can grow up to the viewport cap and scroll inside */
  height?: string
  showCloseButton?: boolean
  title: string
  /** Outer wrapper around the open trigger (e.g. `flex w-full` for a full-width button) */
  wrapperClassName?: string
  /** Extra classes on the trigger button */
  triggerClassName?: string
  /** Optional custom trigger content instead of title text */
  triggerChild?: ReactNode
}

export function PopoverFormField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium leading-none text-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

/** Scrollable body + pinned action row for modal forms */
export function PopoverFormBody({
  children,
  footer,
}: {
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2 pt-10 sm:px-4 sm:pb-3 sm:pt-11">
        {children}
      </div>
      <div className="shrink-0 border-t border-border/60 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 dark:bg-[#121212] sm:border-t-0 sm:bg-transparent sm:px-4 sm:pb-4 sm:pt-1">
        {footer}
      </div>
    </div>
  )
}

export function PopoverForm({
  open,
  setOpen,
  openChild,
  showSuccess,
  successChild,
  width = "364px",
  height = "192px",
  title = "ملاحظات",
  showCloseButton = false,
  wrapperClassName = "inline-flex",
  triggerClassName,
  triggerChild,
}: PopoverFormProps) {
  const ref = useRef<HTMLDivElement>(null)
  const instanceId = useId()
  const portalTarget = useSyncExternalStore(
    () => () => {},
    () => document.body,
    () => null,
  )

  const modal = open ? (
    <div
      className={cn(
        "fixed inset-0 z-200 flex min-h-0 items-center justify-center overflow-y-auto overflow-x-hidden bg-black/25 px-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] ps-[max(0.75rem,env(safe-area-inset-left))] pe-[max(0.75rem,env(safe-area-inset-right))] sm:p-4",
        modalOverlayEnter,
      )}
      role="presentation"
    >
      <div
        className={cn(
          "relative my-auto flex w-full min-h-0 max-w-full flex-col overflow-hidden rounded-xl bg-muted p-1 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0px_1px_2px_rgba(0,0,0,0.04)] outline-none sm:rounded-[10px]",
          modalPanelEnter,
        )}
        ref={ref}
        style={{
          width: `min(${width}, calc(100vw - 1rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))`,
          minHeight: `min(${height}, min(88dvh, 92vh))`,
          maxHeight: `min(92dvh, 92vh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 1.5rem))`,
        }}
      >
        <span
          aria-hidden
          className="absolute start-3 top-3 max-w-[55%] truncate text-xs text-muted-foreground data-success:text-transparent sm:start-4 sm:top-4.25 sm:max-w-[65%] sm:text-sm"
          data-success={showSuccess}
        >
          {title}
        </span>
        {!showSuccess ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute end-3 top-2.5 z-30 rounded-md border px-2 py-1 text-[0.7rem] text-muted-foreground hover:bg-muted sm:end-4 sm:top-3 sm:text-xs"
          >
            إلغاء
          </button>
        ) : null}

        {showCloseButton ? (
          <div className="absolute -top-1.25 left-1/2 z-20 flex h-6.5 w-3 -translate-x-1/2 transform items-center justify-center">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute z-10 -mt-1 flex h-1.5 w-2.5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="إغلاق"
            >
              <ChevronUp className="text-muted-foreground/80" />
            </button>

            <PopoverFormCutOutTopIcon />
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          {showSuccess ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
              {successChild || <PopoverFormSuccess />}
            </div>
          ) : (
            <div
              style={{ borderRadius: 10 }}
              className="z-20 flex min-h-0 flex-1 flex-col overflow-hidden border bg-white dark:bg-[#121212]"
            >
              {openChild}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <div key={instanceId} className={cn(wrapperClassName)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ borderRadius: 8 }}
        className={cn(
          "flex h-9 items-center border bg-white px-3 text-sm font-medium outline-none dark:bg-[#121212]",
          triggerClassName
        )}
      >
        {triggerChild ? triggerChild : <span>{title}</span>}
      </button>
      {portalTarget ? createPortal(modal, portalTarget) : null}
    </div>
  )
}

export function PopoverFormButton({
  loading,
  text = "إرسال",
  variant = "primary",
}: {
  loading: boolean
  text: string
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "violet"
}) {
  const buttonVariantClass = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    warning: "bg-amber-500 text-black hover:bg-amber-600",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    info: "bg-cyan-600 text-white hover:bg-cyan-700",
    violet: "bg-violet-600 text-white hover:bg-violet-700",
  }[variant]

  return (
    <button
      type="submit"
      className={cn(
        "ms-auto flex h-9 min-w-26 shrink-0 items-center justify-center overflow-hidden rounded-md px-3 text-xs font-semibold shadow-sm max-sm:ms-0 max-sm:min-h-10 max-sm:w-full max-sm:min-w-0",
        buttonVariantClass
      )}
    >
      <span className="flex w-full items-center justify-center motion-safe:transition-opacity motion-safe:duration-150">
        {loading ? <Loader className="size-3 animate-spin" /> : text}
      </span>
    </button>
  )
}

export function PopoverFormSuccess({
  title = "تم بنجاح",
  description = "شكرًا، تم استلام البيانات.",
}) {
  return (
    <>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="-mt-1"
      >
        <path
          d="M27.6 16C27.6 17.5234 27.3 19.0318 26.717 20.4392C26.1341 21.8465 25.2796 23.1253 24.2025 24.2025C23.1253 25.2796 21.8465 26.1341 20.4392 26.717C19.0318 27.3 17.5234 27.6 16 27.6C14.4767 27.6 12.9683 27.3 11.5609 26.717C10.1535 26.1341 8.87475 25.2796 7.79759 24.2025C6.72043 23.1253 5.86598 21.8465 5.28302 20.4392C4.70007 19.0318 4.40002 17.5234 4.40002 16C4.40002 12.9235 5.62216 9.97301 7.79759 7.79759C9.97301 5.62216 12.9235 4.40002 16 4.40002C19.0765 4.40002 22.027 5.62216 24.2025 7.79759C26.3779 9.97301 27.6 12.9235 27.6 16Z"
          fill="#2090FF"
          fillOpacity="0.16"
        />
        <path
          d="M12.1334 16.9667L15.0334 19.8667L19.8667 13.1M27.6 16C27.6 17.5234 27.3 19.0318 26.717 20.4392C26.1341 21.8465 25.2796 23.1253 24.2025 24.2025C23.1253 25.2796 21.8465 26.1341 20.4392 26.717C19.0318 27.3 17.5234 27.6 16 27.6C14.4767 27.6 12.9683 27.3 11.5609 26.717C10.1535 26.1341 8.87475 25.2796 7.79759 24.2025C6.72043 23.1253 5.86598 21.8465 5.28302 20.4392C4.70007 19.0318 4.40002 17.5234 4.40002 16C4.40002 12.9235 5.62216 9.97301 7.79759 7.79759C9.97301 5.62216 12.9235 4.40002 16 4.40002C19.0765 4.40002 22.027 5.62216 24.2025 7.79759C26.3779 9.97301 27.6 12.9235 27.6 16Z"
          stroke="#2090FF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h3 className="mb-1 mt-2 text-sm font-medium text-primary">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs text-pretty mx-auto text-center">
        {description}
      </p>
    </>
  )
}

export function PopoverFormSeparator({
  width = 352,
  height = 2,
}: {
  width?: number | string
  height?: number
}) {
  return (
    <svg
      className="absolute -top-px left-0 right-0"
      width={width}
      height={height}
      viewBox="0 0 352 2"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 1H352" className="stroke-border" strokeDasharray="4 4" />
    </svg>
  )
}

function PopoverFormCutOutTopIcon({
  width = 44,
  height = 30,
}: {
  width?: number
  height?: number
}) {
  const aspectRatio = 6 / 12
  const calculatedHeight = width * aspectRatio
  const calculatedWidth = height / aspectRatio

  const finalWidth = Math.min(width, calculatedWidth)
  const finalHeight = Math.min(height, calculatedHeight)

  return (
    <svg
      width={finalWidth}
      height={finalHeight}
      viewBox="0 0 6 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-px rotate-90"
      preserveAspectRatio="none"
    >
      <g clipPath="url(#clip0_2029_22)">
        <path
          d="M0 2C0.656613 2 1.30679 2.10346 1.91341 2.30448C2.52005 2.5055 3.07124 2.80014 3.53554 3.17157C3.99982 3.54301 4.36812 3.98396 4.6194 4.46927C4.87067 4.95457 5 5.47471 5 6C5 6.52529 4.87067 7.04543 4.6194 7.53073C4.36812 8.01604 3.99982 8.45699 3.53554 8.82843C3.07124 9.19986 2.52005 9.4945 1.91341 9.69552C1.30679 9.89654 0.656613 10 0 10V6V2Z"
          className="fill-muted"
        />
        <path
          d="M1 12V10C2.06087 10 3.07828 9.57857 3.82843 8.82843C4.57857 8.07828 5 7.06087 5 6C5 4.93913 4.57857 3.92172 3.82843 3.17157C3.07828 2.42143 2.06087 2 1 2V0"
          className="stroke-border"
          strokeWidth={0.6}
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2029_22">
          <rect width={finalWidth} height={finalHeight} fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export function PopoverFormCutOutLeftIcon() {
  return (
    <svg
      width="6"
      height="12"
      viewBox="0 0 6 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_2029_22)">
        <path
          d="M0 2C0.656613 2 1.30679 2.10346 1.91341 2.30448C2.52005 2.5055 3.07124 2.80014 3.53554 3.17157C3.99982 3.54301 4.36812 3.98396 4.6194 4.46927C4.87067 4.95457 5 5.47471 5 6C5 6.52529 4.87067 7.04543 4.6194 7.53073C4.36812 8.01604 3.99982 8.45699 3.53554 8.82843C3.07124 9.19986 2.52005 9.4945 1.91341 9.69552C1.30679 9.89654 0.656613 10 0 10V6V2Z"
          className="fill-muted"
        />
        <path
          d="M1 12V10C2.06087 10 3.07828 9.57857 3.82843 8.82843C4.57857 8.07828 5 7.06087 5 6C5 4.93913 4.57857 3.92172 3.82843 3.17157C3.07828 2.42143 2.06087 2 1 2V0"
          className="stroke-border"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2029_22">
          <rect width="6" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export function PopoverFormCutOutRightIcon() {
  return (
    <svg
      width="6"
      height="12"
      viewBox="0 0 6 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_2029_22)">
        <path
          d="M0 2C0.656613 2 1.30679 2.10346 1.91341 2.30448C2.52005 2.5055 3.07124 2.80014 3.53554 3.17157C3.99982 3.54301 4.36812 3.98396 4.6194 4.46927C4.87067 4.95457 5 5.47471 5 6C5 6.52529 4.87067 7.04543 4.6194 7.53073C4.36812 8.01604 3.99982 8.45699 3.53554 8.82843C3.07124 9.19986 2.52005 9.4945 1.91341 9.69552C1.30679 9.89654 0.656613 10 0 10V6V2Z"
          className="fill-muted"
        />
        <path
          d="M1 12V10C2.06087 10 3.07828 9.57857 3.82843 8.82843C4.57857 8.07828 5 7.06087 5 6C5 4.93913 4.57857 3.92172 3.82843 3.17157C3.07828 2.42143 2.06087 2 1 2V0"
          className="stroke-border"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2029_22">
          <rect width="6" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export default PopoverForm
