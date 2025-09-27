"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { buttonVariants } from "@marble/ui/components/button";
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
import { ImageIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { DeleteAccountModal } from "@/components/settings/delete-account-modal";
import { ThemeSwitch } from "@/components/settings/theme";
import PageLoader from "@/components/shared/page-loader";
import { AsyncButton } from "@/components/ui/async-button";
import { CopyButton } from "@/components/ui/copy-button";
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

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => {
      return uploadFile({ file, type: "avatar" });
    },
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

  const handleAvatarUpload = useCallback(() => {
    if (!file) {
      return;
    }
    uploadAvatar(file);
  }, [file, uploadAvatar]);

  useEffect(() => {
    if (file) {
      handleAvatarUpload();
    }
  }, [file, handleAvatarUpload]);

  if (isFetchingUser) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto flex w-full max-w-(--breakpoint-md) flex-col gap-8 py-12">
      <div className="py-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-medium text-lg">Account Settings</h1>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
            Dashboard
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-8 py-12">
        <Card className="flex justify-between">
          <CardHeader>
            <CardTitle className="font-medium text-lg">Theme.</CardTitle>
            <CardDescription>Chose your preferred theme.</CardDescription>
          </CardHeader>
          <CardContent className="center flex items-center">
            <ThemeSwitch />
          </CardContent>
          <CardFooter className="border-t">
            <p className="text-muted-foreground text-sm">
              This defaults to the system theme.
            </p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-lg">Avatar.</CardTitle>
            <CardDescription>Change your profile picture.</CardDescription>
          </CardHeader>
          <CardContent className="justify-end">
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
                        handleAvatarUpload();
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
                      <Loader2 className="size-4 animate-spin" />
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
          </CardContent>
          <CardFooter className="border-t">
            <p className="text-muted-foreground text-sm">
              Square images work best for avatars
            </p>
          </CardFooter>
        </Card>

        <Card className="pb-4">
          <form
            className="flex flex-col gap-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <CardHeader>
              <CardTitle className="font-medium text-lg">Full Name</CardTitle>
              <CardDescription>
                Your name will be displayed on your profile and in emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="sr-only" htmlFor="name">
                  Name
                </Label>
                <Input {...register("name")} />
                {errors.name && (
                  <ErrorMessage>{errors.name.message}</ErrorMessage>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
              <AsyncButton
                className="w-20 self-end"
                disabled={!isChanged}
                isLoading={isSubmitting || isUpdatingUser}
                type="submit"
              >
                Save
              </AsyncButton>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-lg">Email.</CardTitle>
            <CardDescription>
              Email associated with your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="justify-end">
            <div>
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input defaultValue={user?.email} readOnly />
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <p className="text-muted-foreground text-sm">
              Email cannot be changed
            </p>
          </CardFooter>
        </Card>

        <Card className="pb-4">
          <CardHeader>
            <CardTitle className="font-medium text-lg">
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end border-t pt-4">
            <DeleteAccountModal />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default PageClient;
