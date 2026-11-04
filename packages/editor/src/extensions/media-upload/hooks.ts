import { toast } from "@marble/ui/components/sonner";
import type { DragEvent } from "react";
import { useCallback, useRef, useState } from "react";

export const useFileUpload = () => {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleUploadClick = useCallback(() => {
    fileInput.current?.click();
  }, []);

  return { ref: fileInput, handleUploadClick };
};

export const useUploader = ({
  onUpload,
  upload,
  onError,
  mediaType,
  accept,
  maxSize,
}: {
  onUpload: (url: string) => void;
  upload: (file: File) => Promise<string>;
  onError?: (error: Error) => void;
  mediaType: "audio" | "video";
  accept?: string;
  maxSize?: number;
}) => {
  const [loading, setLoading] = useState(false);

  const uploadMedia = useCallback(
    async (file: File) => {
      if (
        !file.type.startsWith(`${mediaType}/`) ||
        (accept &&
          !accept
            .split(",")
            .some(
              (type) =>
                type.trim() === file.type || type.trim() === `${mediaType}/*`
            ))
      ) {
        const error = new Error(`This ${mediaType} format is not supported.`);
        if (onError) {
          onError(error);
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (maxSize && file.size > maxSize) {
        const error = new Error(
          `File exceeds the ${maxSize / (1024 * 1024)} MB upload limit.`
        );
        if (onError) {
          onError(error);
        } else {
          toast.error(error.message);
        }
        return;
      }
      setLoading(true);
      try {
        const url = await upload(file);
        if (url) {
          onUpload(url);
        } else {
          const error = new Error(
            "Upload failed: Invalid response from server."
          );
          if (onError) {
            onError(error);
          } else {
            toast.error(error.message);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to upload ${mediaType}`;
        const uploadError = new Error(errorMessage);
        if (onError) {
          onError(uploadError);
        } else {
          toast.error(errorMessage);
        }
      }
      setLoading(false);
    },
    [onUpload, upload, onError, mediaType, accept, maxSize]
  );

  return { loading, uploadMedia };
};

export const useDropZone = ({
  uploader,
}: {
  uploader: (file: File) => void;
}) => {
  const [draggedInside, setDraggedInside] = useState<boolean>(false);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      setDraggedInside(false);
      e.preventDefault();
      e.stopPropagation();

      const fileList = e.dataTransfer.files;
      const files: File[] = [];

      for (let i = 0; i < fileList.length; i += 1) {
        const item = fileList.item(i);
        if (item) {
          files.push(item);
        }
      }

      const file = files[0];

      if (file) {
        uploader(file);
      }
    },
    [uploader]
  );

  const onDragEnter = useCallback(() => {
    setDraggedInside(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDraggedInside(false);
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return { draggedInside, onDragEnter, onDragLeave, onDrop, onDragOver };
};
