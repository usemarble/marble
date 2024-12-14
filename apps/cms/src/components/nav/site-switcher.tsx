"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

import { useForm } from "react-hook-form";
import { type CreateSiteValues, siteSchema } from "@/lib/validations/site";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorMessage } from "@/components/auth/error-message";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { cn } from "@repo/ui/lib/utils";
import { checkSlug, createSiteAction } from "@/lib/actions/create-site";
import { toast } from "@repo/ui/components/sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Site } from "@repo/db/client";

interface SiteSwitcherProps {
  sites: Site[];
}

export function SiteSwitcher({ sites }: SiteSwitcherProps) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const siteSlug = pathname.split("").slice(1).join();
  const currSite = sites.find((site) => site.slug === siteSlug);

  const [activeSite, setActiveSite] = useState(currSite);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function switchSite(slug: string) {
    router.push(`/${slug}`);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square">
                <Avatar className="size-8 rounded-[0.3rem]">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${activeSite?.name}.svg`}
                    className="rounded-md"
                  />
                  <AvatarFallback>HA</AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeSite?.name}
                </span>
                <span className="truncate text-xs">free</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Sites
            </DropdownMenuLabel>
            {sites.map((site) => (
              <DropdownMenuItem
                key={site.id}
                onClick={() => setActiveSite(site)}
              >
                <button
                  type="button"
                  onClick={() => switchSite(site.slug)}
                  className="relative flex w-full items-center gap-4"
                >
                  <Avatar className="size-6 rounded-[0.2rem]">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${site?.name}.svg`}
                    />
                    <AvatarFallback>XX</AvatarFallback>
                  </Avatar>
                  {site.name}
                  {activeSite === site && (
                    <Check className="text-muted-foreground absolute right-0 size-4" />
                  )}
                </button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-2"
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add site
                </div>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <CreateSiteModal open={open} setOpen={setOpen} />
    </SidebarMenu>
  );
}

export const CreateSiteModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateSiteValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: "", slug: "", description: "" },
  });
  const router = useRouter();

  const onSubmit = async (data: CreateSiteValues) => {
    try {
      const slugExists = await checkSlug(data.slug.toLocaleLowerCase());
      if (slugExists) {
        setError("slug", { message: "This slug is in use" });
        return;
      }

      await createSiteAction(data).then((res) => router.push(res.slug));
      setOpen(false);
      toast.success("Site created successfully");
    } catch (error) {
      toast.error("Failed to create site");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new site</DialogTitle>
          <DialogDescription>
            A site is a way for you to manage multiple blogs without mixing them
            together.
          </DialogDescription>
        </DialogHeader>
        {/*  */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name">Site name</Label>
            <Input id="name" {...register("name")} autoComplete="off" />
            {errors.name && <ErrorMessage message={errors.name.message} />}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug">Site slug</Label>
            <div className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-within:ring-ring flex h-10 w-full rounded-md border px-3 text-sm focus-within:ring-2 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <span className="py-2">tiles.com/app/</span>
              <input
                id="slug"
                placeholder="john"
                {...register("slug")}
                autoComplete="off"
                className="w-full bg-transparent py-2 pl-1 outline-none ring-0"
              />
            </div>
            {errors.slug && <ErrorMessage message={errors.slug.message} />}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="description">Site description</Label>
            <Textarea
              id="description"
              placeholder="My food blog"
              {...register("description")}
              className="resize-none"
            />
            {errors.description && (
              <ErrorMessage message={errors.description.message} />
            )}
          </div>
          <div className="mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full gap-2"
            >
              {isSubmitting && <Loader className="size-4 animate-spin" />}
              Create site
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
