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
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type CreateApiKeyValues,
  createApiKeySchema,
  type UpdateApiKeyValues,
  updateApiKeySchema,
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

  const createForm = useForm<CreateApiKeyValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      type: "private",
      permissions: "",
      expiresAt: undefined,
    },
  });

  const updateForm = useForm<UpdateApiKeyValues>({
    resolver: zodResolver(updateApiKeySchema),
    defaultValues: {
      name: data?.name || "",
      permissions: data?.permissions || "",
      expiresAt: data?.expiresAt ? new Date(data.expiresAt) : undefined,
      enabled: data?.enabled ?? true,
    },
  });

  const createType = createForm.watch("type");
  const updateName = updateForm.watch("name");
  const createErrors = createForm.formState.errors;
  const updateErrors = updateForm.formState.errors;
  const isSubmitting =
    createForm.formState.isSubmitting || updateForm.formState.isSubmitting;

  useEffect(() => {
    if (open && data && mode === "update") {
      updateForm.reset({
        name: data.name,
        permissions: data.permissions || "",
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        enabled: data.enabled,
      });
    } else if (open && mode === "create") {
      createForm.reset({
        name: "",
        type: "private",
        permissions: "",
        expiresAt: undefined,
      });
      setCreatedKey(null);
    }
  }, [open, data, mode, createForm, updateForm]);

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
          expiresAt: formData.expiresAt
            ? formData.expiresAt.toISOString()
            : null,
          permissions: formData.permissions || null,
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
    mutationFn: async (formData: UpdateApiKeyValues) => {
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
          expiresAt: formData.expiresAt
            ? formData.expiresAt.toISOString()
            : null,
          permissions: formData.permissions || null,
          enabled: formData.enabled,
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
      updateForm.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmitCreate = async (formData: CreateApiKeyValues) => {
    createKey(formData);
  };

  const onSubmitUpdate = async (formData: UpdateApiKeyValues) => {
    updateKey(formData);
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedKey(null);
    createForm.reset();
    updateForm.reset();
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="p-8 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-medium">
            {mode === "create" ? "Create API Key" : "Update API Key"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new API key to use in your applications."
              : "Update your API key settings."}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <Label className="mb-2 font-medium text-sm">
                Your API Key (save this now, you won't be able to see it again)
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-background px-3 py-2 font-mono text-sm">
                  {createdKey}
                </code>
                <CopyButton
                  textToCopy={createdKey}
                  toastMessage="API key copied to clipboard"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} variant="outline">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="mt-2 flex flex-col gap-5"
            onSubmit={
              mode === "create"
                ? createForm.handleSubmit(
                    onSubmitCreate as (data: CreateApiKeyValues) => void
                  )
                : updateForm.handleSubmit(onSubmitUpdate)
            }
          >
            <div className="grid flex-1 gap-2">
              <Label htmlFor="name">Name</Label>
              {mode === "create" ? (
                <>
                  <Input
                    id="name"
                    {...createForm.register("name")}
                    placeholder="My API Key"
                  />
                  {createErrors.name && (
                    <ErrorMessage>{createErrors.name.message}</ErrorMessage>
                  )}
                </>
              ) : (
                <>
                  <Input
                    id="name"
                    {...updateForm.register("name")}
                    placeholder="My API Key"
                  />
                  {updateErrors.name && (
                    <ErrorMessage>{updateErrors.name.message}</ErrorMessage>
                  )}
                </>
              )}
            </div>

            {mode === "create" && (
              <div className="grid flex-1 gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(value: "public" | "private") => {
                    createForm.setValue("type", value);
                  }}
                  value={createType}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Public keys have read-only access. Private keys have full
                  access.
                </p>
              </div>
            )}

            <div className="grid flex-1 gap-2">
              <Label htmlFor="permissions">Permissions (optional)</Label>
              {mode === "create" ? (
                <>
                  <Input
                    id="permissions"
                    {...createForm.register("permissions")}
                    placeholder="read,write or leave empty for defaults"
                  />
                  {createErrors.permissions && (
                    <ErrorMessage>
                      {createErrors.permissions.message}
                    </ErrorMessage>
                  )}
                </>
              ) : (
                <>
                  <Input
                    id="permissions"
                    {...updateForm.register("permissions")}
                    placeholder="read,write or leave empty for defaults"
                  />
                  {updateErrors.permissions && (
                    <ErrorMessage>
                      {updateErrors.permissions.message}
                    </ErrorMessage>
                  )}
                </>
              )}
            </div>

            {/* <div className="grid flex-1 gap-2">
              <Label htmlFor="expiresAt">Expires At (optional)</Label>
              {mode === "create" ? (
                <>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    {...createForm.register("expiresAt", {
                      setValueAs: (value: string) =>
                        value ? new Date(value) : undefined,
                    })}
                    value={
                      createForm.watch("expiresAt")
                        ? new Date(createForm.watch("expiresAt") as Date)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                  />
                  {createErrors.expiresAt && (
                    <ErrorMessage>
                      {createErrors.expiresAt.message}
                    </ErrorMessage>
                  )}
                </>
              ) : (
                <>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    {...updateForm.register("expiresAt", {
                      setValueAs: (value: string) =>
                        value ? new Date(value) : undefined,
                    })}
                    value={
                      updateForm.watch("expiresAt")
                        ? new Date(updateForm.watch("expiresAt") as Date)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                  />
                  {updateErrors.expiresAt && (
                    <ErrorMessage>
                      {updateErrors.expiresAt.message}
                    </ErrorMessage>
                  )}
                </>
              )}
            </div> */}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
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
