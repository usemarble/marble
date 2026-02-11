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
}: {
  onUpload: (url: string) => void;
  upload: (file: File) => Promise<string>;
  onError?: (error: Error) => void;
}) => {
  const [loading, setLoading] = useState(false);

  const uploadVideo = useCallback(
    async (file: File) => {
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
          error instanceof Error ? error.message : "Failed to upload video";
        const uploadError = new Error(errorMessage);
        if (onError) {
          onError(uploadError);
        } else {
          toast.error(errorMessage);
        }
      }
      setLoading(false);
    },
    [onUpload, upload, onError]
  );

  return { loading, uploadVideo };
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

      // Validate only video files
      if (files.some((file) => !file.type.startsWith("video/"))) {
        toast.error("Only video files are allowed");
        return;
      }

      const filteredFiles = files.filter((f) => f.type.startsWith("video/"));
      const file = filteredFiles.length > 0 ? filteredFiles[0] : undefined;

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
