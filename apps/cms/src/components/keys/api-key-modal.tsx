"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { toast } from "@marble/ui/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type CreateApiKeyValues,
  createApiKeySchema,
} from "@/lib/validations/keys";
import { AsyncButton } from "../ui/async-button";
import type { APIKey } from "./columns";

type ApiKeyModalProps = {
  data?: APIKey;
  mode: "create" | "update";
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function ApiKeyModal({ data, mode, open, setOpen }: ApiKeyModalProps) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const form = useForm<CreateApiKeyValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: data?.name || "",
      type: data?.type || "public",
      expiresAt: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const type = watch("type");

  const { mutate: createKey, isPending: isCreating } = useMutation({
    mutationFn: async (formData: CreateApiKeyValues) => {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          expiresAt: formData.expiresAt,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create API key");
      }

      return res.json();
    },
    onSuccess: (responseData) => {
      setCreatedKey(responseData.key);
      toast.success("API key created successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.KEYS(workspaceId),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updateKey, isPending: isUpdating } = useMutation({
    mutationFn: async (formData: CreateApiKeyValues) => {
      if (!data?.id) {
        throw new Error("API key ID is required");
      }

      const res = await fetch(`/api/keys/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update API key");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("API key updated successfully");
      setOpen(false);
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.KEYS(workspaceId),
        });
      }
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (formData: CreateApiKeyValues) => {
    if (mode === "create") {
      createKey(formData);
    } else {
      updateKey(formData);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedKey(null);
    reset();
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="p-8 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium">
            {createdKey
              ? "API key created"
              : mode === "create"
                ? "Create API Key"
                : "Update API Key"}
          </DialogTitle>
          <DialogDescription>
            {createdKey
              ? "Save this now, you won't be able to see it again"
              : mode === "create"
                ? "Create a key to use with the API."
                : "Update your API key."}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid flex-1 gap-2">
              <div className="flex items-center gap-2">
                <Input readOnly value={createdKey} />
                <CopyButton
                  textToCopy={createdKey}
                  toastMessage="API key copied to clipboard"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="mt-2 flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid flex-1 gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} placeholder="My API Key" />
              {errors.name && (
                <ErrorMessage>{errors.name.message}</ErrorMessage>
              )}
            </div>

            {mode === "create" && (
              <div className="grid flex-1 gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  disabled
                  onValueChange={(value: "public" | "private") =>
                    setValue("type", value)
                  }
                  value={type}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Public keys have read-only access.
                </p>
              </div>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <AsyncButton
                className="gap-2"
                isLoading={isSubmitting || isCreating || isUpdating}
                type="submit"
              >
                {mode === "create" ? "Create" : "Update"}
              </AsyncButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
