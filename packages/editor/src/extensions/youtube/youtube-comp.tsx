import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { YouTubeIcon } from "../../components/icons/youtube";

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  if (!url) {
    return null;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export const YouTubeComp = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Use requestAnimationFrame to ensure the element is rendered
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const validateAndSubmit = useCallback(() => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      setError("Invalid YouTube URL");
      return;
    }

    // Construct a clean YouTube URL
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    onSubmit(cleanUrl);
  }, [url, onSubmit]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setUrl(e.target.value);
      setError(null);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        validateAndSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [validateAndSubmit, onCancel]
  );

  const isValidUrl = extractYouTubeVideoId(url) !== null;

  return (
    <Card className="col-span-full gap-4 rounded-[20px] border-none bg-surface p-2.5">
      <CardHeader className="gap-0 px-4 pt-2">
        <div className="flex items-center justify-between gap-2">
          <YouTubeIcon className="size-5" />
          <CardTitle className="font-normal text-sm">
            Paste a YouTube URL
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="rounded-[12px] bg-background p-4 shadow-xs">
        <div className="flex flex-col gap-2">
          <Textarea
            className={cn(
              "resize-none",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="https://www.youtube.com/watch?v=..."
            ref={inputRef}
            value={url}
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        <CardFooter className="flex items-center gap-2 px-0 pt-4">
          <Button
            disabled={!url || !isValidUrl}
            onClick={validateAndSubmit}
            size="sm"
            type="button"
          >
            Embed Video
          </Button>
          <Button onClick={onCancel} size="sm" type="button" variant="ghost">
            Cancel
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};
