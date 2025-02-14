import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { toast } from "@marble/ui/components/sonner";
import { generateReactHelpers } from "@uploadthing/react";
import { useState } from "react";

function useImageUpload(file: File[] | null, endpoint: string) {
  const { useUploadThing } = generateReactHelpers<OurFileRouter>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  if (endpoint !== "posts") {
    throw new Error("Invalid endpoint.");
  }

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      toast.success("uploaded successfully!", {
        id: "uploading",
        position: "top-center",
      });
      setImageUrl(res[0]?.serverData.image);
      setUploadStatus("Uploaded.");
    },

    onUploadError: () => {
      toast.error("Upload failed", {
        style: {
          border: "1px solid hsl(354 84% 57%)",
        },
        position: "top-right",
        id: "uploading",
      });
      setUploadStatus("Retry.");
    },

    onUploadBegin: () => {
      setUploadStatus("Uploading...");
      toast.loading("uploading...", {
        style: {
          border: "1px solid hsl(243 100% 62%)",
        },
        position: "top-right",
        id: "uploading",
      });
    },
  });

  return { startUpload, imageUrl, uploadStatus };
}

export default useImageUpload;
