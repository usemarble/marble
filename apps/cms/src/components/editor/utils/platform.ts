/**
 * Detects if the user is on a Mac
 */
export function isMac(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
}

/**
 * Returns the appropriate modifier key based on platform
 * "Cmd" for Mac, "Ctrl" for other platforms
 */
export function getModifierKey(): string {
  return isMac() ? "Cmd" : "Ctrl";
}
