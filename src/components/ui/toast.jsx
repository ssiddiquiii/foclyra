"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const toast = ToastPrimitive.createToastManager()
const ToastProgressContext = React.createContext({
  progressBar: true,
  defaultTimeout: 4000,
})

function ToastProvider({ progressBar = true, timeout = 4000, ...props }) {
  const contextValue = React.useMemo(
    () => ({ progressBar, defaultTimeout: timeout }),
    [progressBar, timeout]
  )
  return (
    <ToastProgressContext.Provider value={contextValue}>
      <ToastPrimitive.Provider timeout={timeout} {...props} />
    </ToastProgressContext.Provider>
  )
}

function ToastPortal({ ...props }) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({ className, ...props }) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-16 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        className
      )}
      {...props}
    />
  )
}

function Toast({ className, ...props }) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "rounded-2xl group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))]",
        "h-(--height)",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height)",
        "data-limited:opacity-0",
        "[--scale:calc(max(0,1-(var(--toast-index)*0.1)))]",
        "[--shrink:calc(1-var(--scale))]",
        "[--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))]",
        "transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--gap))-(var(--shrink)*var(--height))))_scale(var(--scale))]",
        "data-expanded:transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "transition-[transform,scale,opacity,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-starting-style:transform-[translateY(150%)]",
        "data-ending-style:opacity-0",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:transform-[translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        className
      )}
      {...props}
    />
  )
}

function ToastContent({ className, ...props }) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 data-behind:pointer-events-none data-behind:opacity-0 data-expanded:pointer-events-auto data-expanded:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-medium text-popover-foreground", className)}
      {...props}
    />
  )
}

function ToastDescription({ className, ...props }) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0 cursor-pointer", className)}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative shrink-0 cursor-pointer text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        className
      )}
      {...props}
    >
      {children ?? <X strokeWidth={2} aria-hidden="true" />}
    </ToastPrimitive.Close>
  )
}

function ToastIcon({ type }) {
  let icon = null

  if (type === "success") {
    icon = (
      <CheckCircle2
        strokeWidth={2}
        className="text-primary"
        aria-hidden="true"
      />
    )
  }

  if (type === "info") {
    icon = (
      <Info
        strokeWidth={2}
        className="text-primary"
        aria-hidden="true"
      />
    )
  }

  if (type === "warning") {
    icon = (
      <AlertTriangle
        strokeWidth={2}
        className="text-amber-500"
        aria-hidden="true"
      />
    )
  }

  if (type === "error") {
    icon = (
      <XCircle
        strokeWidth={2}
        className="text-destructive"
        aria-hidden="true"
      />
    )
  }

  if (type === "loading") {
    icon = (
      <Loader2
        strokeWidth={2}
        className="animate-spin text-primary"
        aria-hidden="true"
      />
    )
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  )
}

function ToastProgressBar({ toastItem }) {
  const { progressBar, defaultTimeout } = React.useContext(ToastProgressContext)
  if (!progressBar || toastItem.type === "loading") {
    return null
  }

  const duration = toastItem.timeout ?? defaultTimeout
  if (!duration || duration <= 0) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      data-slot="toast-progress"
      className="pointer-events-none absolute inset-x-3 bottom-0 h-[3px] overflow-hidden rounded-full"
    >
      <div
        key={`${toastItem.id}-${toastItem.type || "default"}-${duration}`}
        style={{
          animation: `toastProgress ${duration}ms linear forwards`,
        }}
        className={cn(
          "h-full w-full origin-left rounded-full bg-primary group-hover/toast:[animation-play-state:paused] group-data-expanded/toast:[animation-play-state:paused]"
        )}
      />
    </div>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toastItem) => (
    <Toast
      key={toastItem.id}
      toast={toastItem}
      className={cn(
        toastItem.type === "success" && "border-primary/30",
        toastItem.type === "error" && "border-destructive/30"
      )}
    >
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-1",
            toastItem.type === "success" && "text-emerald-600 dark:text-emerald-400",
            toastItem.type === "error" && "text-red-600 dark:text-red-400"
          )}
        >
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
      <ToastProgressBar toastItem={toastItem} />
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = toast,
  progressBar = true,
  ...props
}) {
  return (
    <ToastProvider
      toastManager={toastManager}
      progressBar={progressBar === true || progressBar === "true"}
      {...props}
    >
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}

export default function ToastDemo({ progressBar = true }) {
  function showToast() {
    const id = toast.add({
      title: "Event created",
      description: "Sunday, December 3 at 9:00 AM",
      actionProps: {
        children: "Undo",
        onClick() {
          toast.close(id)
        },
      },
    })
  }

  return (
    <Toaster progressBar={progressBar === true || progressBar === "true"}>
      <Button variant="outline" onClick={showToast}>
        Show Toast
      </Button>
    </Toaster>
  )
}
