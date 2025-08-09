import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop" | null;

function getDevice(): DeviceType {
  if (typeof window === "undefined") {
    return null;
  }

  let device: DeviceType = "mobile";

  if (window.matchMedia("(min-width: 1024px)").matches) {
    device = "desktop";
  }

  if (window.matchMedia("(min-width: 640px)").matches) {
    device = "tablet";
  }

  return device;
}

function getDimensions() {
  if (typeof window === "undefined") {
    return null;
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

export function useMediaQuery() {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop" | null>(
    getDevice()
  );
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(getDimensions());

  useEffect(() => {
    const checkDevice = () => {
      setDevice(getDevice());
      setDimensions(getDimensions());
    };

    // Initial detection
    checkDevice();

    // Listener for windows resize
    window.addEventListener("resize", checkDevice);

    // Cleanup listener
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return {
    device,
    width: dimensions?.width,
    height: dimensions?.height,
    isMobile: device === "mobile",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
  };
}
