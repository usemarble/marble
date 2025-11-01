"use client";

import { createContext, useContext } from "react";

type FloatingPortalContextValue = {
  container: HTMLElement | null | undefined;
};

const FloatingPortalContext = createContext<FloatingPortalContextValue>({
  container: typeof document === "undefined" ? null : document.body,
});

export function FloatingPortalProvider({
  container,
  children,
}: {
  container: HTMLElement | null | undefined;
  children: React.ReactNode;
}) {
  return (
    <FloatingPortalContext.Provider value={{ container }}>
      {children}
    </FloatingPortalContext.Provider>
  );
}

export function useFloatingPortalContainer() {
  return useContext(FloatingPortalContext).container ?? null;
}
