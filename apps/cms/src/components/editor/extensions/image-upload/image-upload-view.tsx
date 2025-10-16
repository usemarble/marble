import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/core";
import { useCallback } from "react";
import { ImageUploader } from "./image-uploader";

export const ImageUploadView = ({ getPos, editor }: NodeViewProps) => {
	const onUpload = useCallback(
		(url: string) => {
			if (url && typeof getPos === "function") {
				const pos = getPos();
				if (typeof pos === "number") {
					// Replace the imageUpload node with an actual image
					editor
						.chain()
						.focus()
						.deleteRange({ from: pos, to: pos + 1 })
						.setImage({ src: url })
						.run();
				}
			}
		},
		[getPos, editor],
	);

	return (
		<NodeViewWrapper>
			<div className="p-0 m-0" data-drag-handle>
				<ImageUploader onUpload={onUpload} />
			</div>
		</NodeViewWrapper>
	);
};
