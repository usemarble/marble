/**
 * Scrolls a container while something is being dragged near its top or
 * bottom edge. Browsers only do this themselves inside a ~20px strip at the
 * very edge, after a delay and at a slow fixed pace, which makes moving a
 * block more than a screen away a chore. This uses a larger zone and speeds
 * up the closer the pointer gets to (or past) the edge, like Notion.
 */

/** Height of the hot zone at each edge, in px. */
const EDGE_SIZE = 120;
/** Scroll speed with the pointer at or past the edge, in px per second. */
const MAX_SPEED = 1800;
/**
 * Browsers keep firing dragover while the pointer rests (every 350ms at the
 * latest, per spec). Longer than this without one means the drag left the
 * window without a usable dragleave, so stop rather than scroll forever.
 */
const STALE_AFTER = 1000;

export interface DragPointer {
  x: number;
  y: number;
}

export interface DragAutoScrollOptions {
  /**
   * Called after each frame that actually scrolled, with the last pointer
   * position and drag event. The pointer does not move while the content
   * scrolls under it, so this is the place to refresh anything that tracks
   * "what is under the pointer" (the drop cursor, for instance).
   */
  onScroll?: (pointer: DragPointer, event: DragEvent) => void;
}

function ramp(progress: number) {
  return Math.min(Math.max(progress, 0), 1) ** 1.5;
}

function getSpeed(container: HTMLElement, pointer: DragPointer) {
  const rect = container.getBoundingClientRect();

  if (pointer.x < rect.left || pointer.x > rect.right) {
    return 0;
  }

  const edge = Math.min(EDGE_SIZE, rect.height / 4);
  const fromTop = pointer.y - rect.top;
  const fromBottom = rect.bottom - pointer.y;

  // Past the edge by more than a zone's height means the pointer is over
  // something else entirely (another panel), not reaching for the edge.
  if (fromTop < -edge || fromBottom < -edge) {
    return 0;
  }

  if (fromTop < edge) {
    return -MAX_SPEED * ramp(1 - fromTop / edge);
  }

  if (fromBottom < edge) {
    return MAX_SPEED * ramp(1 - fromBottom / edge);
  }

  return 0;
}

export function bindDragAutoScroll(
  container: HTMLElement,
  { onScroll }: DragAutoScrollOptions = {}
) {
  let pointer: DragPointer | null = null;
  let lastEvent: DragEvent | null = null;
  let lastEventTime = 0;
  let frame: number | null = null;
  let lastTime = 0;
  // scrollTop is rounded, so sub-pixel steps at low speeds are carried over
  let carry = 0;

  const step = (time: number) => {
    if (!(pointer && lastEvent) || time - lastEventTime > STALE_AFTER) {
      frame = null;
      return;
    }

    const speed = getSpeed(container, pointer);

    if (speed === 0) {
      frame = null;
      return;
    }

    const elapsed = lastTime ? Math.min(time - lastTime, 48) : 16;
    lastTime = time;
    carry += (speed * elapsed) / 1000;

    const delta = Math.trunc(carry);
    carry -= delta;

    if (delta !== 0) {
      const before = container.scrollTop;
      container.scrollTop = before + delta;

      if (container.scrollTop === before) {
        // Reached the top or bottom; the next dragover restarts the loop.
        frame = null;
        carry = 0;
        return;
      }

      onScroll?.(pointer, lastEvent);
    }

    frame = requestAnimationFrame(step);
  };

  const start = () => {
    if (frame === null) {
      lastTime = 0;
      frame = requestAnimationFrame(step);
    }
  };

  const stop = () => {
    pointer = null;
    lastEvent = null;
    carry = 0;

    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  };

  const onDragOver = (event: DragEvent) => {
    // Ignore the dragover events replayed into the editor from the gutter.
    if (!event.isTrusted) {
      return;
    }

    pointer = { x: event.clientX, y: event.clientY };
    lastEvent = event;
    lastEventTime = performance.now();

    if (getSpeed(container, pointer) !== 0) {
      start();
    }
  };

  const onDragLeave = (event: DragEvent) => {
    // Only stop when the pointer leaves the window. `relatedTarget` is not
    // reliable for drag events across browsers, so go by coordinates.
    const leftWindow =
      event.clientX <= 0 ||
      event.clientY <= 0 ||
      event.clientX >= window.innerWidth ||
      event.clientY >= window.innerHeight;

    if (leftWindow) {
      stop();
    }
  };

  document.addEventListener("dragover", onDragOver, true);
  document.addEventListener("dragleave", onDragLeave, true);
  document.addEventListener("drop", stop, true);
  document.addEventListener("dragend", stop, true);

  return () => {
    stop();
    document.removeEventListener("dragover", onDragOver, true);
    document.removeEventListener("dragleave", onDragLeave, true);
    document.removeEventListener("drop", stop, true);
    document.removeEventListener("dragend", stop, true);
  };
}
