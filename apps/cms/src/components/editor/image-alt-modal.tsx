"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { useEditor } from "novel";
import { useEffect, useState } from "react";

interface ImageAltModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  imageSrc: string;
  currentAlt?: string;
  onSave: (alt: string) => void;
}

export function ImageAltModal({
  isOpen,
  setIsOpen,
  imageSrc,
  currentAlt = "",
  onSave,
}: ImageAltModalProps) {
  const [altText, setAltText] = useState(currentAlt);
  const editor = useEditor();

  useEffect(() => {
    setAltText(currentAlt);
  }, [currentAlt]);

  const handleSave = () => {
    onSave(altText);
    setIsOpen(false);
    toast.success("Alt text updated");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit image alt text</DialogTitle>
          <DialogDescription>
            Describe the image for screen readers and accessibility.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
            {/* biome-ignore lint/performance/noImgElement: <> */}
            <img
              src={imageSrc}
              alt={altText || "Image preview"}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alt-text">Alt text</Label>
            <Input
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what's in the image..."
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to save
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
