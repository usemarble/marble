"use client";

import { ErrorMessage } from "@/components/auth/error-message";
import { Github, Google } from "@/components/icons/social";
import { DeleteAccountModal } from "@/components/settings/delete-account-modal";
import { ThemeSwitch } from "@/components/settings/theme";
import Container from "@/components/shared/container";
import { ButtonLoader } from "@/components/ui/loader";
import { updateUserAction } from "@/lib/actions/account";
import { uploadUserAvatarAction } from "@/lib/actions/media";
import type { ProfileData } from "@/lib/validations/settings";
import { profileSchema } from "@/lib/validations/settings";
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
import { cn } from "@marble/ui/lib/utils";
import { At, Check, Copy, Image, UploadSimple } from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface AccountSettingsPageClientProps {
  accountDetails: {
    id: string;
    createdAt: Date;
    providerId: string;
    accountId: string;
    email: string;
  }[];
  userDetails: {
    name: string;
    email: string;
    id: string;
    image: string | null | undefined;
  };
}

const availableConnections = [
  {
    id: "google",
    name: "Google",
    icon: <Google />,
  },
  {
    id: "github",
    name: "GitHub",
    icon: <Github />,
  },
  {
    id: "email",
    name: "Email",
    icon: <At />,
  },
];

export default function PageClient({
  accountDetails,
  userDetails,
}: AccountSettingsPageClientProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(
    userDetails.image,
  );
  const [avatarCopied, setAvatarCopied] = useState(false);
  const [isNameChanged, setIsNameChanged] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userDetails.name || "",
    },
  });

  const { name, email } = watch();

  const handleLogoUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Compression failed");
      }

      const compressedBlob = await response.blob();
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, ".webp"),
        {
          type: "image/webp",
        },
      );

      const result = await uploadUserAvatarAction(compressedFile);

      setAvatarUrl(result.avatarUrl);

      setIsUploading(false);
      toast.success("Uploaded complete", {
        id: "uploading",
      });

      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
        {
          id: "uploading",
        },
      );
      setIsUploading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (file) {
      handleLogoUpload();
    }
  }, [file]);

  useEffect(() => {
    setIsNameChanged(name !== userDetails.name);
  }, [name, userDetails.name]);

  const onSubmit = async (formData: ProfileData) => {
    try {
      await updateUserAction(formData, userDetails.id);
      setIsNameChanged(false);
      toast.success("Account details updated");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const copyAvatar = () => {
    navigator.clipboard.writeText(avatarUrl || "");
    setAvatarCopied(true);
    setTimeout(() => {
      setAvatarCopied(false);
    }, 1000);
  };

  return (
    <div>
      <Container className="py-4">
        <div className="flex items-center gap-2 justify-between">
          <h1 className="text-lg font-medium">Account Settings</h1>
          <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
            Dashboard
          </Link>
        </div>
      </Container>
      <div className="w-full max-w-screen-md mx-auto space-y-8 pt-8 pb-14">
        <Card className="flex justify-between p-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Theme.</CardTitle>
            <CardDescription className="">
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
            <CardDescription>Change your profile image.</CardDescription>
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
                      <Image className="size-4" />
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
                        handleLogoUpload();
                      }
                    }}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-background/50 backdrop-blur-sm size-full",
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

        <Card>
          <CardHeader className="px-10">
            <CardTitle className="text-lg font-medium">Name.</CardTitle>
            <CardDescription>
              This is how you appear on the app.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="justify-end px-10">
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
            <CardFooter className="border-t items-center py-4 justify-between px-10">
              <p className="text-sm text-muted-foreground">Max 32 characters</p>
              <Button
                disabled={!isNameChanged || isSubmitting}
                className="min-w-28"
              >
                {isSubmitting ? <ButtonLoader /> : "Save"}
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
              <Input defaultValue={userDetails.email} disabled />
            </div>
          </CardContent>
        </Card>

        {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Notifications.</CardTitle>
          <CardDescription>
            Manage your notification settings for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="justify-end">
          <ul className="flex flex-col gap-6">
            <li className="flex gap-4">
              <Checkbox id="newsletter" className="rounded" />
              <div className="flex flex-col gap-2">
                <Label htmlFor="newsletter">Receive newsletter</Label>
                <p className="text-muted-foreground text-sm">
                  I want to receive updates about relevant products or services.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Checkbox id="member" className="rounded" />
              <div className="flex flex-col gap-2">
                <Label htmlFor="member">Member activities</Label>
                <p className="text-muted-foreground text-sm">
                  Stay informed and receive notifications when team members join
                  or leave your workspaces.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Checkbox id="publish" className="rounded" />
              <div className="flex flex-col gap-2">
                <Label htmlFor="publish">Publishing activities</Label>
                <p className="text-muted-foreground text-sm">
                  Receive notifications when scheduled articles are published.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="border-t items-center py-4 justify-end">
          <Button onClick={() => {}} className="min-w-28">
            Save
          </Button>
        </CardFooter>
      </Card> */}

        {/* Sign-in connections */}

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Sign-in connections
            </CardTitle>
            <CardDescription>
              Connected external accounts for sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-8">
              {accountDetails.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {account.providerId === "github" ? (
                      <Github className="size-7" />
                    ) : (
                      <Google className="size-7" />
                    )}
                    <div>
                      <p className="font-medium">{account.email}</p>
                      <p className="text-sm text-muted-foreground">
                        You can sign in with your {account.providerId} account.
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Connected{" "}
                    {account.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </li>
              ))}

              {!accountDetails.some(
                (account) => account.providerId === "google",
              ) && (
                <li className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Google className="size-8" />
                    <div>
                      <p className="font-medium">Connect Google</p>
                      <p className="text-sm text-muted-foreground">
                        Link your Google account for faster login.
                      </p>
                    </div>
                  </div>
                  <Button disabled={!isNameChanged} className="min-w-28">
                    Connect
                  </Button>
                </li>
              )}
              {!accountDetails.some(
                (account) => account.providerId === "github",
              ) && (
                <li className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Github className="size-8" />
                    <div>
                      <p className="font-medium">Connect GitHub</p>
                      <p className="text-sm text-muted-foreground">
                        Link your GitHub account for faster login.
                      </p>
                    </div>
                  </div>
                  <Button disabled={!isNameChanged} className="min-w-28">
                    Connect
                  </Button>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-10">
            <CardTitle className="text-lg">Delete account.</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data within.
              This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end py-4 border-t">
            <DeleteAccountModal id={userDetails.id} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
