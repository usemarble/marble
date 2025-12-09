"use client"

import { Toast } from "@base-ui-components/react/toast"

export const toastManager = Toast.createToastManager()

export const useToast = Toast.useToastManager

type ToastType = "success" | "error" | "info" | "warning" | "loading" | "default"

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export type ToastData = {
  position?: ToastPosition
}

type ToastOptions = {
  id?: string
  title?: string
  description?: string
  type?: ToastType
  duration?: number
  position?: ToastPosition
  actionProps?: {
    label: string
    onClick: () => void
  }
}

type ToastApi = {
  add: (options: ToastOptions) => string
  success: (message: string, options?: Omit<ToastOptions, "type">) => string
  error: (message: string, options?: Omit<ToastOptions, "type">) => string
  info: (message: string, options?: Omit<ToastOptions, "type">) => string
  warning: (message: string, options?: Omit<ToastOptions, "type">) => string
  loading: (message: string, options?: Omit<ToastOptions, "type">) => string
  dismiss: (id: string) => void
  update: (id: string, options: ToastOptions) => void
}

export const toast: ToastApi = {
  add: (options) => {
    return toastManager.add({
      title: options.title,
      description: options.description,
      type: options.type,
      timeout: options.duration,
      actionProps: options.actionProps
        ? { children: options.actionProps.label, onClick: options.actionProps.onClick }
        : undefined,
      data: options.position ? ({ position: options.position } satisfies ToastData) : undefined,
    })
  },
  success: (message, options) => {
    return toastManager.add({
      title: message,
      type: "success",
      timeout: options?.duration,
      data: options?.position ? { position: options.position } : undefined,
    })
  },
  error: (message, options) => {
    return toastManager.add({
      title: message,
      type: "error",
      timeout: options?.duration,
      data: options?.position ? { position: options.position } : undefined,
    })
  },
  info: (message, options) => {
    return toastManager.add({
      title: message,
      type: "info",
      timeout: options?.duration,
      data: options?.position ? { position: options.position } : undefined,
    })
  },
  warning: (message, options) => {
    return toastManager.add({
      title: message,
      type: "warning",
      timeout: options?.duration,
      data: options?.position ? { position: options.position } : undefined,
    })
  },
  loading: (message, options) => {
    return toastManager.add({
      title: message,
      type: "loading",
      timeout: 0,
      data: options?.position ? { position: options.position } : undefined,
    })
  },
  dismiss: (id) => {
    toastManager.close(id)
  },
  update: (id, options) => {
    toastManager.update(id, {
      title: options.title,
      description: options.description,
      type: options.type,
      timeout: options.duration,
      actionProps: options.actionProps
        ? { children: options.actionProps.label, onClick: options.actionProps.onClick }
        : undefined,
    })
  },
}
