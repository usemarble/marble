"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Button, buttonVariants } from "@marble/ui/components/button";
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
import { Copy, Image as ImageIcon, UploadSimple } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { DeleteAccountModal } from "@/components/settings/delete-account-modal";
import { ThemeSwitch } from "@/components/settings/theme";
import { ButtonLoader } from "@/components/ui/loader";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type ProfileData, profileSchema } from "@/lib/validations/settings";
import { useUser } from "@/providers/user";

function PageClient() {
  const queryClient = useQueryClient();
  const { user, updateUser, isUpdatingUser } = useUser();
  const [isChanged, setIsChanged] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user?.image ?? undefined
  );
  const [file, setFile] = useState<File | null>(null);
  const [avatarCopied, setAvatarCopied] = useState(false);

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: async (formFile: File) => {
      const formData = new FormData();
      formData.append("file", formFile);

      const response = await fetch("/api/uploads/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload avatar");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      updateUser({ image: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
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

  const copyAvatar = () => {
    navigator.clipboard.writeText(avatarUrl || "");
    setAvatarCopied(true);
    setTimeout(() => {
      setAvatarCopied(false);
    }, 1000);
  };

  return (
    <div className="mx-auto flex w-full max-w-screen-md flex-col gap-8 py-12">
      <div className="py-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-medium text-lg">Account Settings</h1>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
            Dashboard
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-8 py-12">
        <Card className="flex justify-between p-4">
          <CardHeader>
            <CardTitle className="font-medium text-lg">Theme.</CardTitle>
            <CardDescription>
              Override the default theme of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="center flex items-center pb-0">
            <ThemeSwitch />
          </CardContent>
        </Card>
        <Card className="p-4">
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
                      <ImageIcon className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <input
                    accept="image/*"
                    className="sr-only"
                    id="logo"
                    onChange={(e) => {
                      const eventFile = e.target.files?.[0];
                      if (eventFile && !isUploading) {
                        setFile(eventFile);
                        handleAvatarUpload();
                      }
                    }}
                    title="Upload logo"
                    type="file"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 flex size-full items-center justify-center bg-background/50 backdrop-blur-sm transition-opacity duration-300",
                      isUploading
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UploadSimple className="size-4" />
                    )}
                  </div>
                </Label>
              </div>
              <div className="flex w-full items-center gap-2">
                <Input defaultValue={avatarUrl || undefined} readOnly />
                <Button
                  className="px-3"
                  onClick={copyAvatar}
                  size="icon"
                  type="submit"
                  variant="outline"
                >
                  <span className="sr-only">Copy</span>
                  {avatarCopied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <form onSubmit={handleSubmit(onSubmit)}>
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
            <CardFooter className="justify-end">
              <Button
                className="w-20 self-end"
                disabled={!isChanged || isSubmitting || isUpdatingUser}
                type="submit"
              >
                {isSubmitting || isUpdatingUser ? <ButtonLoader /> : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="p-4">
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
              <Input defaultValue={user?.email} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="font-medium text-lg">
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <DeleteAccountModal />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default PageClient;
