"use client";

import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { memo, useCallback, useEffect, useState } from "react";

function ImageToolbarComponent() {
	const { editor } = useCurrentEditor();
	const [alt, setAlt] = useState("");
	const [caption, setCaption] = useState("");

	// Update local state when selection changes
	useEffect(() => {
		if (!editor) return;

		const updateState = () => {
			const { selection } = editor.state;
			const node = editor.state.doc.nodeAt(selection.from);

			if (node?.type.name === "figure") {
				setAlt(node.attrs.alt || "");
				setCaption(node.attrs.caption || "");
			}
		};

		updateState();
		editor.on("selectionUpdate", updateState);

		return () => {
			editor.off("selectionUpdate", updateState);
		};
	}, [editor]);

	const handleAltChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newAlt = e.target.value;
			setAlt(newAlt);
			editor?.commands.updateFigure({ alt: newAlt });
		},
		[editor],
	);

	const handleCaptionChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newCaption = e.target.value;
			setCaption(newCaption);
			editor?.commands.updateFigure({ caption: newCaption });
		},
		[editor],
	);

	const shouldShow = useCallback(
		({ editor: ed }: { editor: typeof editor }) => {
			if (!ed) return false;

			const { selection } = ed.state;
			const node = ed.state.doc.nodeAt(selection.from);

			return node?.type.name === "figure";
		},
		[],
	);

	if (!editor) {
		return null;
	}

	return (
		<TiptapBubbleMenu
			editor={editor}
			shouldShow={shouldShow}
			className="flex flex-col gap-3 rounded-lg border bg-background p-3 shadow-lg w-80"
		>
			<div className="space-y-2">
				<Label htmlFor="alt-text" className="text-xs font-medium">
					Alt Text
				</Label>
				<Input
					id="alt-text"
					type="text"
					value={alt}
					onChange={handleAltChange}
					placeholder="Describe the image..."
					className="h-8 text-sm"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="caption" className="text-xs font-medium">
					Caption
				</Label>
				<Input
					id="caption"
					type="text"
					value={caption}
					onChange={handleCaptionChange}
					placeholder="Add a caption..."
					className="h-8 text-sm"
				/>
			</div>
		</TiptapBubbleMenu>
	);
}

export const ImageToolbar = memo(ImageToolbarComponent);
