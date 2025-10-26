"use client";

import { Button } from "@marble/ui/components/button";
import { PlusIcon, UploadIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { toast } from "sonner";
import { ALLOWED_MIME_TYPES, MAX_MEDIA_FILE_SIZE } from "@/lib/constants";

type FileUploadInputProps = {
	onUpload?: (files: FileList) => void;
	isUploading?: boolean;
	accept?: string;
	multiple?: boolean;
	variant?: "default" | "icon";
	className?: string;
	children?: React.ReactNode;
	maxSize?: number;
};

export function FileUploadInput({
	onUpload,
	isUploading: isUploadingProp = false,
	accept = ALLOWED_MIME_TYPES.join(","),
	multiple = true,
	variant = "default",
	className,
	children,
	maxSize = MAX_MEDIA_FILE_SIZE,
}: FileUploadInputProps) {
	const id = useId();

	function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files || files.length === 0) {
			return;
		}

		for (const file of Array.from(files)) {
			if (file.size > maxSize) {
				toast.error(
					`File "${file.name}" exceeds the maximum size of ${maxSize / (1024 * 1024)} MB.`,
				);
				return;
			}
		}

		onUpload?.(files);
		e.target.value = "";
	}

	return (
		<>
			<input
				accept={accept}
				aria-label="Upload File(s)"
				className="hidden"
				disabled={isUploadingProp}
				id={id}
				multiple={multiple}
				onChange={handleFileUpload}
				type="file"
			/>
			<Button
				asChild
				className={className}
				disabled={isUploadingProp}
				type="button"
			>
				<label
					aria-busy={isUploadingProp ? "true" : "false"}
					aria-disabled={isUploadingProp ? "true" : "false"}
					className="flex cursor-pointer items-center gap-2"
					htmlFor={id}
				>
					{children || (
						<>
							{variant === "icon" ? (
								<PlusIcon className="size-4" />
							) : (
								<UploadIcon size={16} />
							)}
							<span>{variant === "icon" ? "Upload" : "Upload File(s)"}</span>
						</>
					)}
				</label>
			</Button>
		</>
	);
}
