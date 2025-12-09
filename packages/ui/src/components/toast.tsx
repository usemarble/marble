"use client"

import { toastManager, useToast, type ToastData, type ToastPosition } from "@marble/ui/hooks/use-toast"
import { Toast } from "@base-ui-components/react/toast"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LoaderIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { buttonVariants } from "@marble/ui/components/button"
import { cn } from "@marble/ui/lib/utils"

const TOAST_ICONS: Record<string, React.ReactNode> = {
  loading: <LoaderIcon className="animate-spin" />,
  success: <CircleCheckIcon />,
  error: <CircleAlertIcon />,
  info: <InfoIcon />,
  warning: <TriangleAlertIcon />,
}

const ToastProvider = (props: React.ComponentProps<typeof Toast.Provider>) => {
  const { children, ...rest } = props

  return (
    <Toast.Provider toastManager={toastManager} {...rest}>
      {children}
      <ToastList />
    </Toast.Provider>
  )
}

function isToastData(data: unknown): data is ToastData {
  return typeof data === "object" && data !== null && ("position" in data || Object.keys(data).length === 0)
}

function getToastPosition(toast: Toast.Root.ToastObject): ToastPosition | "default" {
  if (isToastData(toast.data) && toast.data.position) {
    return toast.data.position
  }
  return "default"
}

const ToastList = () => {
  const { toasts } = useToast()

  const positionGroups: Record<ToastPosition | "default", Array<Toast.Root.ToastObject<ToastData>>> = {
    "top-left": [],
    "top-center": [],
    "top-right": [],
    "bottom-left": [],
    "bottom-center": [],
    "bottom-right": [],
    default: [],
  }

  for (const toast of toasts) {
    const position = getToastPosition(toast)
    positionGroups[position].push(toast as Toast.Root.ToastObject<ToastData>)
  }

  const viewportClasses: Record<ToastPosition | "default", string> = {
    "top-left": "fixed z-[51] top-[1rem] left-[1rem] right-auto bottom-auto mx-auto flex w-full max-w-[356px]",
    "top-center": "fixed z-[51] top-[1rem] right-0 bottom-auto left-0 mx-auto flex w-full max-w-[356px]",
    "top-right": "fixed z-[51] top-[1rem] right-[1rem] bottom-auto left-auto mx-auto flex w-full max-w-[356px]",
    "bottom-left": "fixed z-[51] bottom-[1rem] left-[1rem] top-auto right-auto mx-auto flex w-full max-w-[356px]",
    "bottom-center": "fixed z-[51] bottom-[1rem] right-0 top-auto left-0 mx-auto flex w-full max-w-[356px]",
    "bottom-right": "fixed z-[51] bottom-[1rem] right-[1rem] top-auto left-auto mx-auto flex w-full max-w-[356px]",
    default: "fixed z-[51] top-[1rem] right-0 bottom-auto left-0 mx-auto flex w-full max-w-[356px]",
  }

  const renderToasts = (toastGroup: Array<Toast.Root.ToastObject<ToastData>>) =>
    toastGroup.map((toast) => (
      <Toast.Root
        key={toast.id}
        toast={toast}
        swipeDirection={["right", "up"]}
        data-slot="toast"
        className={cn(
          "[--gap:0.8rem] [--peek:0.8rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)+(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))]",
          "absolute right-0 top-0 left-0 z-[calc(1000-var(--toast-index))] mx-auto w-full origin-top",
          "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))]",
          "bg-popover text-popover-foreground rounded-lg border bg-clip-padding p-4 shadow-lg select-none",
          "after:absolute after:bottom-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
          "data-[ending-style]:opacity-0 data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))]",
          "data-[limited]:opacity-0 data-[starting-style]:[transform:translateY(-150%)] data-[starting-style]:opacity-0",
          "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(-150%)]",
          "data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
          "data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
          "data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
          "data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
          "data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
          "data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
          "data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
          "data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
          "h-[var(--height)] data-[expanded]:h-[var(--toast-height)]",
          "[transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]"
        )}
      >
        <Toast.Content className="overflow-hidden transition-opacity [transition-duration:250ms] data-[behind]:pointer-events-none data-[behind]:opacity-0 data-[expanded]:pointer-events-auto data-[expanded]:opacity-100 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            {toast.type && TOAST_ICONS[toast.type] && (
              <div
                className="shrink-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                data-slot="toast-icon"
              >
                {TOAST_ICONS[toast.type]}
              </div>
            )}

            <div className="flex flex-col">
              <Toast.Title
                className="text-sm leading-relaxed font-medium"
                data-slot="toast-title"
              />
              <Toast.Description
                className="text-sm leading-normal opacity-80"
                data-slot="toast-description"
              />
            </div>
          </div>
          {toast.actionProps && (
            <Toast.Action
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-6 px-2 text-xs font-medium"
              )}
              data-slot="toast-action"
            >
              {toast.actionProps.children}
            </Toast.Action>
          )}
        </Toast.Content>
      </Toast.Root>
    ))

  return (
    <Toast.Portal data-slot="toast-portal">
      {(Object.keys(positionGroups) as Array<ToastPosition | "default">).map(
        (position) =>
          positionGroups[position].length > 0 && (
            <Toast.Viewport
              key={position}
              className={viewportClasses[position]}
              data-position={position === "default" ? undefined : position}
              data-slot="toast-viewport"
            >
              {renderToasts(positionGroups[position])}
            </Toast.Viewport>
          )
      )}
    </Toast.Portal>
  )
}

export { ToastProvider }
