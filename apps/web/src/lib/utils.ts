import { cn as mergeClassNames } from "cn";

export const cn = mergeClassNames;

export function calculateReadTime(content: string) {
  const wordsPerMinute = 200;
  const plainText = content.replace(/<[^>]*>/g, "").trim();
  const wordCount = plainText.split(/\s+/).length;

  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime;
}
