"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import {
  CircleNotchIcon,
  ImageIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { DashboardBody } from "@/components/layout/wrapper";
import { CropImageModal } from "@/components/media/crop-image-modal";
import { DeleteAccountModal } from "@/components/settings/delete-account";
import { AccountSettingsSkeleton } from "@/components/settings/loading-skeletons";
import { SettingsSection } from "@/components/settings/section";
import { AsyncButton } from "@/components/ui/async-button";
import { CopyButton } from "@/components/ui/copy-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { MAX_AVATAR_FILE_SIZE } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type ProfileData, profileSchema } from "@/lib/validations/settings";
import { useUser } from "@/providers/user";

function PageClient() {
  const queryClient = useQueryClient();
  const { user, updateUser, isUpdatingUser, isFetchingUser } = useUser();
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<
    string | undefined
  >();
  const avatarUrl = pendingAvatarUrl ?? user?.image ?? undefined;
  const [file, setFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadFile({ file, type: "avatar" }),
    onSuccess: (data) => {
      setPendingAvatarUrl(data.url);
      updateUser({ image: data.url });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER });
      setFile(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpdateUser = async (data: { name: string }) => {
    try {
      await updateUser(data);
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const watchedName = watch("name");
  const hasNameChanges =
    (watchedName ?? "").trim() !== (user?.name ?? "").trim() && isDirty;

  useEffect(() => {
    if (user) {
      reset({ name: user.name ?? "", email: user.email ?? "" });
    }
  }, [user, reset]);

  const onSubmit = (data: ProfileData) => {
    if (!user?.id) {
      return;
    }
    handleUpdateUser({ name: data.name });
  };

  const handleReset = () => {
    setFile(null);
  };

  if (isFetchingUser) {
    return <AccountSettingsSkeleton />;
  }

  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <SettingsSection
        description="Change your profile picture. Square images work best."
        title="Avatar"
      >
        <div className="flex items-center gap-6 rounded-[14px] bg-background px-4 py-3.5">
          <Label
            className={cn(
              "group relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-full",
              isUploading && "pointer-events-none"
            )}
            htmlFor="logo"
          >
            <Avatar className="size-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>
                <ImageIcon className="size-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            <input
              accept="image/*"
              className="sr-only"
              id="logo"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile && !isUploading) {
                  setFile(selectedFile);
                  setCropOpen(true);
                }
              }}
              title="Upload avatar"
              type="file"
            />
            <div
              className={cn(
                "absolute inset-0 flex size-full items-center justify-center bg-background/50 backdrop-blur-xs transition-opacity duration-300",
                isUploading
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              {isUploading ? (
                <CircleNotchIcon className="size-4 animate-spin" />
              ) : (
                <UploadSimpleIcon className="size-4" />
              )}
            </div>
          </Label>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Input readOnly value={avatarUrl || ""} />
            <CopyButton
              textToCopy={avatarUrl || ""}
              toastMessage="Avatar URL copied to clipboard."
            />
          </div>
        </div>
      </SettingsSection>
      <CropImageModal
        aspect={1}
        file={file}
        maxImageSize={MAX_AVATAR_FILE_SIZE}
        onCropped={(cropped) => {
          setCropOpen(false);
          uploadAvatar(cropped);
        }}
        onOpenChange={(open) => {
          setCropOpen(open);
          if (!open) {
            setFile(null);
          }
        }}
        open={cropOpen}
        reset={() => {
          handleReset();
        }}
      />

      <SettingsSection
        description="Your name will be displayed on your profile and in emails."
        title="Full Name"
      >
        <form
          className="flex flex-col gap-2 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-start"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="min-w-0 flex-1">
            <Label className="sr-only" htmlFor="name">
              Name
            </Label>
            <Input {...register("name")} />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <AsyncButton
            className="w-20 self-end"
            disabled={!hasNameChanges}
            isLoading={isSubmitting || isUpdatingUser}
            type="submit"
          >
            Save
          </AsyncButton>
        </form>
      </SettingsSection>

      <SettingsSection
        description="Email associated with your account. This cannot be changed."
        title="Email"
      >
        <div className="rounded-[14px] bg-background px-4 py-3.5">
          <Label className="sr-only" htmlFor="email">
            Email
          </Label>
          <Input defaultValue={user?.email} disabled readOnly />
        </div>
      </SettingsSection>

      <SettingsSection
        description="Permanently delete your account and all associated data."
        title="Delete Account"
      >
        <div className="flex flex-col gap-3 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={2} />
            </div>
            <p className="text-muted-foreground text-sm">
              Account deletion is permanent.
            </p>
          </div>
          <DeleteAccountModal />
        </div>
      </SettingsSection>
    </DashboardBody>
  );
}

export default PageClient;
