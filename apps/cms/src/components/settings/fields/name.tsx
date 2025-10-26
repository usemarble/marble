"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type NameValues, nameSchema } from "@/lib/validations/workspace";
import { useWorkspace } from "@/providers/workspace";

export function Name() {
	const router = useRouter();
	const { activeWorkspace, isOwner } = useWorkspace();
	const queryClient = useQueryClient();
	const nameId = useId();

	const nameForm = useForm<NameValues>({
		resolver: zodResolver(nameSchema),
		defaultValues: { name: activeWorkspace?.name || "" },
	});

	const { mutate: updateName, isPending } = useMutation({
		mutationFn: async ({
			organizationId,
			data,
		}: {
			organizationId: string;
			data: NameValues;
		}) => {
			const res = await organization.update({
				organizationId,
				data: {
					name: data.name,
				},
			});
			if (res?.error) {
				throw new Error(res.error.message);
			}
			return res;
		},
		onSuccess: (_, variables) => {
			toast.success("Workspace name updated");
			nameForm.reset({ name: nameForm.getValues("name") });
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.WORKSPACE(variables.organizationId),
			});
			router.refresh();
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to update workspace name";
			toast.error(errorMessage);
			console.error("Failed to update workspace name:", error);
		},
	});

	const onNameSubmit = (data: NameValues) => {
		// need to work on proper permissons later
		if (!isOwner || !activeWorkspace?.id) {
			return;
		}
		updateName({
			organizationId: activeWorkspace.id,
			data: { name: data.name.trim() },
		});
	};

	return (
		<Card className="pb-4">
			<CardHeader>
				<CardTitle className="font-medium text-lg">Workspace Name</CardTitle>
				<CardDescription>
					The name of your workspace on marble. typically your websites name
				</CardDescription>
			</CardHeader>
			<form
				className="flex flex-col gap-6"
				onSubmit={nameForm.handleSubmit(onNameSubmit)}
			>
				<CardContent>
					<div className="flex w-full flex-col gap-2">
						<div className="flex items-center gap-2">
							<div className="flex flex-1 flex-col gap-2">
								<Label className="sr-only" htmlFor={nameId}>
									Name
								</Label>
								<Input
									id={nameId}
									{...nameForm.register("name")}
									disabled={!isOwner}
									placeholder="Technology"
								/>
							</div>
						</div>
						{nameForm.formState.errors.name && (
							<p className="text-destructive text-xs">
								{nameForm.formState.errors.name.message}
							</p>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex justify-between border-t pt-4">
					<p className="text-muted-foreground text-sm">Max 32 characters</p>
					<AsyncButton
						className={cn("flex w-20 items-center gap-2 self-end")}
						disabled={!isOwner || !nameForm.formState.isDirty}
						isLoading={isPending}
					>
						Save
					</AsyncButton>
				</CardFooter>
			</form>
		</Card>
	);
}
