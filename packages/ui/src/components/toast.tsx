"use client"

import { toastManager, useToast } from "@marble/ui/hooks/use-toast"
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

const ToastList = () => {
  const { toasts } = useToast()

  return (
    <Toast.Portal data-slot="toast-portal">
      <Toast.Viewport
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[51] flex w-[calc(100%_-_2rem)] sm:top-8 sm:w-[356px]"
        data-slot="toast-viewport"
      >
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            swipeDirection={["right", "up"]}
            data-slot="toast"
            className={cn(
              "bg-popover text-popover-foreground absolute top-0 left-0 right-0 z-[calc(1000-var(--toast-index))] flex w-full items-center justify-between gap-1.5 rounded-lg border bg-clip-padding p-4 shadow-lg transition-all [transition-property:opacity,transform] duration-200 ease-out select-none",
              "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
              "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+calc(min(var(--toast-index),10)*var(--gap))))_scale(calc(max(0,1-(var(--toast-index)*0.1))))]",
              "data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-offset-y)+calc(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y)))]",
              "data-[ending-style]:opacity-0 data-[limited]:opacity-0 data-[starting-style]:[transform:translateY(-150%)] data-[starting-style]:opacity-0 data-[ending-style]:[&:not([data-limited])]:[transform:translateY(-150%)]",
              "data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
              "data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]"
            )}
            style={{
              ["--gap" as string]: "0.8rem",
              ["--offset-y" as string]:
                "calc(var(--toast-offset-y) + (var(--toast-index) * var(--gap)) + var(--toast-swipe-movement-y))",
            }}
          >
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
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export { ToastProvider }
