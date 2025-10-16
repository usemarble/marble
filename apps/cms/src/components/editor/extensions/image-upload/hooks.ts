import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { toast } from "@marble/ui/components/sonner";
import { uploadFile } from "@/lib/media/upload";

export const useFileUpload = () => {
	const fileInput = useRef<HTMLInputElement>(null);

	const handleUploadClick = useCallback(() => {
		fileInput.current?.click();
	}, []);

	return { ref: fileInput, handleUploadClick };
};

export const useUploader = ({
	onUpload,
}: { onUpload: (url: string) => void }) => {
	const [loading, setLoading] = useState(false);

	const uploadImage = useCallback(
		async (file: File) => {
			setLoading(true);
			try {
				const media = await uploadFile({ file, type: "media" });
				if (media?.url) {
					onUpload(media.url);
				} else {
					toast.error("Upload failed: Invalid response from server.");
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to upload image";
				toast.error(errorMessage);
			}
			setLoading(false);
		},
		[onUpload],
	);

	return { loading, uploadImage };
};

export const useDropZone = ({
	uploader,
}: { uploader: (file: File) => void }) => {
	const [draggedInside, setDraggedInside] = useState<boolean>(false);

	const onDrop = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			setDraggedInside(false);
			e.preventDefault();
			e.stopPropagation();

			const fileList = e.dataTransfer.files;
			const files: File[] = [];

			for (let i = 0; i < fileList.length; i++) {
				const item = fileList.item(i);
				if (item) {
					files.push(item);
				}
			}

			// Validate only image files
			if (files.some((file) => !file.type.startsWith("image/"))) {
				toast.error("Only image files are allowed");
				return;
			}

			const filteredFiles = files.filter((f) => f.type.startsWith("image/"));
			const file = filteredFiles.length > 0 ? filteredFiles[0] : undefined;

			if (file) {
				uploader(file);
			}
		},
		[uploader],
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
