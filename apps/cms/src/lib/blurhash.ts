import { decode } from "blurhash";

const cache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 200;

const DEFAULT_WIDTH = 32;
const DEFAULT_HEIGHT = 32;

export function blurhashToDataUrl(
  blurHash: string,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT
) {
  if (typeof document === "undefined") {
    return undefined;
  }

  const trimmedBlurHash = blurHash.trim();
  const cacheKey = `${trimmedBlurHash}:${width}x${height}`;
  const cachedDataUrl = cache.get(cacheKey);

  if (cachedDataUrl) {
    cache.delete(cacheKey);
    cache.set(cacheKey, cachedDataUrl);
    return cachedDataUrl;
  }

  try {
    const pixels = decode(trimmedBlurHash, width, height);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    canvas.width = width;
    canvas.height = height;

    const imageData = context.createImageData(width, height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    cache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch {
    return undefined;
  }
}
