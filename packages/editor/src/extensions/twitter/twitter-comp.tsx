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
import { useCallback, useState } from "react";
import { Twitter } from "../../components/icons/twitter";

// Validate Twitter/X.com URL
const TWITTER_REGEX =
  /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]{1,15})(\/status\/(\d+))?(\/\S*)?$/;

function isValidTwitterUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  return TWITTER_REGEX.test(url);
}

export const TwitterComp = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateAndSubmit = useCallback(() => {
    if (!isValidTwitterUrl(url)) {
      setError("Invalid Tweet link");
      return;
    }

    onSubmit(url);
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

  const isValidUrl = isValidTwitterUrl(url) !== null;

  return (
    <Card className="col-span-full gap-4 rounded-[20px] border-none bg-sidebar p-2.5">
      <CardHeader className="gap-0 px-4 pt-2">
        <div className="flex items-center justify-between gap-2">
          <Twitter className="size-5" />
          <CardTitle className="font-normal text-sm">
            Paste a Tweet link
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="rounded-[12px] bg-background p-4 shadow-xs">
        <div className="flex flex-col gap-2">
          <Textarea
            autoFocus
            className={cn(
              "resize-none",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="https://x.com/username/status/..."
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
            Embed Tweet
          </Button>
          <Button onClick={onCancel} size="sm" type="button" variant="ghost">
            Cancel
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};
