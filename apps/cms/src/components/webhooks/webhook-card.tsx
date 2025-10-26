"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@marble/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import {
	CopyIcon,
	DotsThreeVerticalIcon,
	ToggleRightIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Webhook } from "@/types/webhook";

const DeleteWebhookModal = dynamic(() =>
	import("@/components/webhooks/delete-webhook").then(
		(mod) => mod.DeleteWebhookModal,
	),
);

type WebhookCardProps = {
	webhook: Webhook;
	onToggle: (data: { id: string; enabled: boolean }) => void;
	onDelete: () => void;
	isToggling: boolean;
	toggleVariables?: { id: string; enabled: boolean };
};

export function WebhookCard({
	webhook,
	onToggle,
	onDelete,
	isToggling,
	toggleVariables,
}: WebhookCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const handleCopySecret = (secret: string) => {
		navigator.clipboard.writeText(secret);
		toast.success("Secret copied to clipboard");
	};

	return (
		<li>
			<Card>
				<CardHeader className="flex justify-between">
					<div className="mb-2 flex items-center gap-3">
						<CardTitle className="text-lg">{webhook.name}</CardTitle>
						<Badge
							className="text-xs"
							variant={webhook.enabled ? "positive" : "negative"}
						>
							{webhook.enabled ? "Enabled" : "Disabled"}
						</Badge>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="icon" variant="ghost">
								<DotsThreeVerticalIcon size={16} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								disabled={isToggling && toggleVariables?.id === webhook.id}
								onClick={() =>
									onToggle({
										id: webhook.id,
										enabled: !webhook.enabled,
									})
								}
							>
								<ToggleRightIcon className="mr-1.5" size={16} />
								<span>{webhook.enabled ? "Disable" : "Enable"} Webhook</span>
							</DropdownMenuItem>
							{webhook.format === "json" ? (
								<DropdownMenuItem
									onClick={() => handleCopySecret(webhook.secret)}
								>
									<CopyIcon className="mr-1.5 size-4" />
									Copy Secret
								</DropdownMenuItem>
							) : undefined}
							<DropdownMenuItem
								disabled={isToggling}
								onSelect={(_e) => setIsOpen(true)}
								variant="destructive"
							>
								<TrashIcon className="mr-1.5 size-4 text-inherit" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</CardHeader>
				<CardContent>
					<div className="flex items-start justify-between">
						<div className="min-w-0 flex-1">
							<p className="mb-3 line-clamp-1 break-all font-mono text-muted-foreground text-sm">
								{webhook.endpoint}
							</p>
							<div className="flex items-center justify-between gap-4 text-muted-foreground text-xs">
								<span>
									Created {format(new Date(webhook.createdAt), "MMM d, yyyy")}
								</span>
								<div>
									<span>
										{webhook.events.length} event
										{webhook.events.length !== 1 ? "s" : ""}
									</span>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
			<DeleteWebhookModal
				isOpen={isOpen}
				onDelete={onDelete}
				onOpenChange={setIsOpen}
				webhookId={webhook.id}
				webhookName={webhook.name}
			/>
		</li>
	);
}
