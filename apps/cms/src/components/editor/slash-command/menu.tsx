"use client";

import { cn } from "@marble/ui/lib/utils";
import type { SuggestionProps } from "@tiptap/suggestion";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
	type ReactNode,
} from "react";

export type SlashCommandItem = {
	title: string;
	description?: string;
	searchTerms?: string[];
	icon: ReactNode;
	command?: (props: { editor: any; range: any }) => void;
};

type MenuListProps = SuggestionProps & {
	items?: SlashCommandItem[];
};

export const SlashCommandMenu = forwardRef<
	{ onKeyDown: (props: { event: KeyboardEvent }) => boolean },
	MenuListProps
>((props, ref) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const items = props.items || [];

	const selectItem = (index: number) => {
		const item = items[index];

		if (!item) {
			return;
		}

		if (item.command) {
			item.command({ editor: props.editor, range: props.range });
		}
	};

	const upHandler = () => {
		setSelectedIndex((selectedIndex + items.length - 1) % items.length);
	};

	const downHandler = () => {
		setSelectedIndex((selectedIndex + 1) % items.length);
	};

	const enterHandler = () => {
		selectItem(selectedIndex);
	};

	useEffect(() => setSelectedIndex(0), [items]);

	useImperativeHandle(ref, () => ({
		onKeyDown: ({ event }: { event: KeyboardEvent }) => {
			if (event.key === "ArrowUp") {
				upHandler();
				return true;
			}

			if (event.key === "ArrowDown") {
				downHandler();
				return true;
			}

			if (event.key === "Enter") {
				enterHandler();
				return true;
			}

			return false;
		},
	}));

	return (
		<>
			<div className="z-50 h-auto max-h-80 w-60 overflow-y-auto rounded-sm border bg-background px-1 py-2 shadow-xs transition-all">
				{items.length > 0 ? (
					<div className="space-y-0.5">
						{items.map((item, index) => (
							<button
								key={item.title}
								type="button"
								className={cn(
									"flex w-full cursor-pointer items-center space-x-2 rounded-[6px] px-2 py-1 text-left text-sm hover:bg-accent",
									index === selectedIndex && "bg-accent",
								)}
								onClick={() => selectItem(index)}
								onMouseEnter={() => setSelectedIndex(index)}
							>
								<div className="flex items-center justify-center border border-muted bg-background p-1">
									{item.icon}
								</div>
								<div>
									<p className="font-medium">{item.title}</p>
									{item.description && (
										<p className="text-xs text-muted-foreground">
											{item.description}
										</p>
									)}
								</div>
							</button>
						))}
					</div>
				) : (
					<div className="px-2 text-muted-foreground text-sm">No results</div>
				)}
			</div>
		</>
	);
});

SlashCommandMenu.displayName = "SlashCommandMenu";
