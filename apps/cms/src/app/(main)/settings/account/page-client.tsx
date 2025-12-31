"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { buttonVariants } from "@marble/ui/components/button";
import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
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
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { CropImageModal } from "@/components/media/crop-image-modal";
import { DeleteAccountModal } from "@/components/settings/delete-account";
import { ThemeSwitch } from "@/components/settings/theme";
import PageLoader from "@/components/shared/page-loader";
import { AsyncButton } from "@/components/ui/async-button";
import { CopyButton } from "@/components/ui/copy-button";
import { MAX_AVATAR_FILE_SIZE } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type ProfileData, profileSchema } from "@/lib/validations/settings";
import { useUser } from "@/providers/user";

function PageClient() {
  const queryClient = useQueryClient();
  const { user, updateUser, isUpdatingUser, isFetchingUser } = useUser();
  const [isChanged, setIsChanged] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user?.image ?? undefined
  );
  const [file, setFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadFile({ file, type: "avatar" }),
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      updateUser({ image: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER });
      setFile(null);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(error.message);
    },
  });

  const handleUpdateUser = async (data: { name: string }) => {
    try {
      await updateUser(data);
      setIsChanged(false);
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name ?? "", email: user.email ?? "" });
      setAvatarUrl(user.image ?? undefined);
    }
  }, [user, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      setIsChanged(value.name !== user?.name);
    });
    return () => subscription.unsubscribe();
  }, [watch, user?.name]);

  const onSubmit = (data: ProfileData) => {
    if (!user?.id) {
      return;
    }
    handleUpdateUser({ name: data.name });
  };

  const handleReset = () => {
    setFile(null);
  };

  useEffect(() => {
    if (file) {
      setCropOpen(true);
    }
  }, [file]);

  if (isFetchingUser) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto flex w-full max-w-(--breakpoint-md) flex-col gap-8 py-12">
      <div className="py-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-medium text-lg">Account Settings</h1>
          <Link
            className={cn(
              "shadow-none",
              buttonVariants({ variant: "outline" })
            )}
            href="/"
          >
            Dashboard
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-8 py-12">
        <Card className="gap-0 rounded-[20px] border-none bg-sidebar p-2">
          <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="font-medium text-lg">Theme</CardTitle>
              <CardDescription>Choose your preferred theme.</CardDescription>
            </div>
            <div className="flex items-center">
              <ThemeSwitch />
            </div>
          </div>
          <div className="px-2 pt-4 pb-2">
            <p className="text-muted-foreground text-sm">
              This defaults to the system theme.
            </p>
          </div>
        </Card>
        <Card className="gap-0 rounded-[20px] border-none bg-sidebar p-2">
          <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="font-medium text-lg">Avatar</CardTitle>
              <CardDescription>Change your profile picture.</CardDescription>
            </div>
            <div className="justify-end">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-5">
                  <Label
                    className={cn(
                      "group relative size-16 cursor-pointer overflow-hidden rounded-full",
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
                        const file = e.target.files?.[0];
                        if (file && !isUploading) {
                          setFile(file);
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
                </div>
                <div className="flex w-full items-center gap-2">
                  <Input readOnly value={avatarUrl || ""} />
                  <CopyButton
                    textToCopy={avatarUrl || ""}
                    toastMessage="Avatar URL copied to clipboard."
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="px-2 pt-4 pb-2">
            <p className="text-muted-foreground text-sm">
              Square images work best for avatars
            </p>
          </div>
        </Card>
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

        <Card className="rounded-[20px] border-none bg-sidebar p-2">
          <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
              <div className="flex flex-col gap-1.5">
                <CardTitle className="font-medium text-lg">Full Name</CardTitle>
                <CardDescription>
                  Your name will be displayed on your profile and in emails.
                </CardDescription>
              </div>
              <div className="flex w-full flex-col gap-2">
                <div>
                  <Label className="sr-only" htmlFor="name">
                    Name
                  </Label>
                  <Input {...register("name")} />
                  {errors.name && (
                    <ErrorMessage>{errors.name.message}</ErrorMessage>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 pt-2">
              <p className="text-muted-foreground text-sm">Your display name</p>
              <AsyncButton
                className={cn("flex w-20 items-center gap-2 self-end")}
                disabled={!isChanged}
                isLoading={isSubmitting || isUpdatingUser}
                size="sm"
                type="submit"
              >
                Save
              </AsyncButton>
            </div>
          </form>
        </Card>

        <Card className="gap-0 rounded-[20px] border-none bg-sidebar p-2">
          <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="font-medium text-lg">Email</CardTitle>
              <CardDescription>
                Email associated with your account.
              </CardDescription>
            </div>
            <div className="justify-end">
              <div>
                <Label className="sr-only" htmlFor="email">
                  Email
                </Label>
                <Input defaultValue={user?.email} disabled readOnly />
              </div>
            </div>
          </div>
          <div className="px-2 pt-4 pb-2">
            <p className="text-muted-foreground text-sm">
              Email cannot be changed
            </p>
          </div>
        </Card>

        <Card className="gap-0 rounded-[20px] border-none bg-sidebar p-2">
          <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="font-medium text-lg">
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </CardDescription>
            </div>
          </div>
          <div className="flex justify-end px-2 pt-2">
            <DeleteAccountModal />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PageClient;
