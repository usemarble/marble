import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { cn } from "@marble/ui/lib/utils";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";

export const FigureView = ({
	node,
	updateAttributes,
	selected,
}: NodeViewProps) => {
	const { src, alt, caption } = node.attrs as {
		src: string;
		alt: string;
		caption: string;
	};

	const [altValue, setAltValue] = useState(alt || "");
	const [captionValue, setCaptionValue] = useState(caption || "");

	// Sync local state with node attributes when they change externally
	useEffect(() => {
		setAltValue(alt || "");
		setCaptionValue(caption || "");
	}, [alt, caption]);

	const handleAltChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newAlt = e.target.value;
			setAltValue(newAlt);
			updateAttributes({ alt: newAlt });
		},
		[updateAttributes],
	);

	const handleCaptionChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newCaption = e.target.value;
			setCaptionValue(newCaption);
			updateAttributes({ caption: newCaption });
		},
		[updateAttributes],
	);

	return (
		<NodeViewWrapper data-drag-handle>
			<figure
				className={cn(
					"relative my-4 mx-0",
					selected && "outline outline-2 outline-primary outline-offset-2",
				)}
			>
				{/* biome-ignore lint/performance/noImgElement: Tiptap NodeView requires standard img element */}
				<img
					src={src}
					alt={altValue}
					className="w-full rounded-md border border-muted"
				/>

				{/* Toolbar overlay - only shown when selected */}
				{selected && (
					<div className="absolute top-2 right-2 flex flex-col gap-2 rounded-lg border bg-background p-3 shadow-lg w-64 z-10">
						<div className="space-y-1.5">
							<Label htmlFor="alt-text" className="text-xs font-medium">
								Alt Text
							</Label>
							<Input
								id="alt-text"
								type="text"
								value={altValue}
								onChange={handleAltChange}
								placeholder="Describe the image..."
								className="h-8 text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="caption" className="text-xs font-medium">
								Caption
							</Label>
							<Input
								id="caption"
								type="text"
								value={captionValue}
								onChange={handleCaptionChange}
								placeholder="Add a caption..."
								className="h-8 text-sm"
							/>
						</div>
					</div>
				)}

				{/* Caption - only shown when it has content */}
				{caption && (
					<figcaption className="mt-2 text-sm text-muted-foreground italic text-center">
						{caption}
					</figcaption>
				)}
			</figure>
		</NodeViewWrapper>
	);
};
