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
    user?.image ?? undefined,
  );
  const [file, setFile] = useState<File | null>(null);
  const [avatarCopied, setAvatarCopied] = useState(false);

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

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
    if (!user?.id) return;
    handleUpdateUser({ name: data.name });
  };

  const handleAvatarUpload = useCallback(() => {
    if (!file) return;
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
    <div className="flex flex-col gap-8 py-12 max-w-(--breakpoint-md) mx-auto w-full">
      <div className="py-4">
        <div className="flex items-center gap-2 justify-between">
          <h1 className="text-lg font-medium">Account Settings</h1>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Dashboard
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-8 py-12">
        <Card className="flex justify-between p-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Theme.</CardTitle>
            <CardDescription>
              Override the default theme of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center center pb-0">
            <ThemeSwitch />
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Avatar.</CardTitle>
            <CardDescription>Change your profile picture.</CardDescription>
          </CardHeader>
          <CardContent className="justify-end">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-5">
                <Label
                  htmlFor="logo"
                  className={cn(
                    "cursor-pointer relative overflow-hidden rounded-full size-16 group",
                    isUploading && "pointer-events-none",
                  )}
                >
                  <Avatar className="size-16">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback>
                      <ImageIcon className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <input
                    title="Upload logo"
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && !isUploading) {
                        setFile(file);
                        handleAvatarUpload();
                      }
                    }}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-background/50 backdrop-blur-xs size-full",
                      isUploading
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
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
              <div className="flex items-center gap-2 w-full">
                <Input defaultValue={avatarUrl || undefined} readOnly />
                <Button
                  variant="outline"
                  type="submit"
                  size="icon"
                  onClick={copyAvatar}
                  className="px-3"
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
              <CardTitle className="text-lg font-medium">Full Name</CardTitle>
              <CardDescription>
                Your name will be displayed on your profile and in emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="name" className="sr-only">
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
                disabled={!isChanged || isSubmitting || isUpdatingUser}
                className="w-20 self-end"
                type="submit"
              >
                {isSubmitting || isUpdatingUser ? <ButtonLoader /> : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Email.</CardTitle>
            <CardDescription>
              Email associated with your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="justify-end">
            <div>
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input defaultValue={user?.email} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
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
