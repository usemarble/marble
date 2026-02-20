"use client";

import { cn } from "@marble/ui/lib/utils";
import type { VideoHTMLAttributes } from "react";
import { useMemo, useRef } from "react";

export type VideoPlayerProps = VideoHTMLAttributes<HTMLVideoElement>;

const tRegex = /t=(\d+(?:\.\d+)?)/;

export const VideoPlayer = ({ className, ...props }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const initialTime = useMemo(() => {
    const src = (props.src ?? "") as string;
    const hashIndex = src.indexOf("#");
    if (hashIndex === -1) {
      return 0;
    }
    const hash = src.slice(hashIndex + 1);
    const tMatch = hash.match(tRegex);
    return tMatch ? Number.parseFloat(tMatch[1] ?? "0") : 0;
  }, [props.src]);

  const handleMouseOver = () => {
    videoRef.current?.play();
  };

  const handleMouseOut = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = initialTime;
    }
  };

  const handleFocus = () => {
    videoRef.current?.play();
  };

  const handleBlur = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = initialTime;
    }
  };

  return (
    <video
      className={cn(
        "absolute inset-0 size-full object-cover",
        "transition-opacity duration-200",
        "group-hover:opacity-90",
        className
      )}
      loop
      muted
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseOut={handleMouseOut}
      onMouseOver={handleMouseOver}
      preload="metadata"
      ref={videoRef}
      tabIndex={0}
      {...props}
    />
  );
};
