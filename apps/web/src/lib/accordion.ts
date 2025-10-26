export const setAccordionHeight = (
  accordions: NodeListOf<HTMLDetailsElement>
) => {
  const originalStates = Array.from(accordions).map(
    (accordion) => accordion.open
  );

  for (const accordion of accordions) {
    accordion.classList.remove("accordion-item--animated");
    resetAccordionHeight(accordion);
    assignHeight(accordion);
  }

  accordions.forEach((accordion, index) => {
    accordion.open = originalStates[index];
    accordion.classList.add("accordion-item--animated");
  });
};

const resetAccordionHeight = (accordion: HTMLDetailsElement) => {
  accordion.style.removeProperty("--accordion-item-expanded");
  accordion.style.removeProperty("--accordion-item-collapsed");
};

const assignHeight = (accordion: HTMLDetailsElement) => {
  accordion.open = false;
  const collapsedHeight = accordion.offsetHeight;

  accordion.open = true;
  const expandedHeight = accordion.scrollHeight;

  accordion.style.setProperty(
    "--accordion-item-expanded",
    `${expandedHeight}px`
  );
  accordion.style.setProperty(
    "--accordion-item-collapsed",
    `${collapsedHeight}px`
  );
};

export const debounce = (
  callback: (...args: unknown[]) => void,
  delay: number
) => {
  let timeout: number;

  return (...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), delay);
  };
};

export const handleResize = (callback: () => void) => {
  const debouncedCallback = debounce(callback, 300);
  window.addEventListener("resize", debouncedCallback);

  return () => {
    window.removeEventListener("resize", debouncedCallback);
  };
};

export const isTouchDevice = () =>
  window.matchMedia("(pointer: coarse)").matches;

let lastWidth: number;

export const hasViewportWidthChanged = (): boolean => {
  if (typeof window !== "undefined") {
    const currentWidth = window.innerWidth;
    const widthChanged = currentWidth !== lastWidth;

    if (widthChanged) {
      lastWidth = currentWidth;
    }

    return widthChanged;
  }

  return false;
};
