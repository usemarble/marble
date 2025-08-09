import { toast } from "@marble/ui/components/sonner";
import { createImageUpload } from "novel/plugins";

const onUpload = (file: File) => {
  const promise = fetch("/api/upload", {
    method: "POST",
    headers: {
      "content-type": file?.type || "application/octet-stream",
      "x-vercel-filename": file?.name || "image.png",
    },
    body: file,
  });

  //This should return a src of the uploaded image
  return promise;
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file) => {
    if (!file.type.includes("image/")) {
      toast.error("File type not supported.");
      return false;
    }
    if (file.size / 1024 / 1024 > 4) {
      toast.error("File size too big (max 4MB).");
      return false;
    }
    return true;
  },
});
