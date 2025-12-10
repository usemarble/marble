import { all, createLowlight } from "lowlight";

/**
 * Create a lowlight instance with all languages loaded
 * Used for syntax highlighting in code blocks
 */
export const lowlight = createLowlight(all);
