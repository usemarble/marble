import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { cn } from "@marble/ui/lib/utils";
import { YoutubeLogoIcon } from "@phosphor-icons/react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useState } from "react";

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

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

export const YouTubeInput = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
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
    <div className="flex flex-col gap-4 rounded-md border border-muted bg-muted/50 p-6">
      <div className="flex items-center gap-3">
        <YoutubeLogoIcon className="size-8 text-red-500" />
        <div>
          <h3 className="font-medium text-sm">Embed YouTube Video</h3>
          <p className="text-muted-foreground text-xs">
            Paste a YouTube URL or video ID
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Input
          autoFocus
          className={cn(
            "bg-background",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>

      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
};
