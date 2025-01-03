"use client";

import { Check, ChevronsUpDown, Loader, Plus } from "@repo/ui/lib/icons";
import { useState } from "react";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";

import { ErrorMessage } from "@/components/auth/error-message";
import { useWorkspace } from "@/components/providers/workspace";
import {
  checkWorkspaceSlug,
  createWorkspaceAction,
} from "@/lib/actions/workspace";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "@/lib/validations/site";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Organization } from "@repo/db/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/sonner";
import { Textarea } from "@repo/ui/components/textarea";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface WorkspaceWithPlan extends Organization {
  plan: string;
}

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceWithPlan[];
}

export function WorkspaceSwitcher({ workspaces }: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const { workspace, setWorkspace } = useWorkspace();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Find the current workspace with full details including plan
  const currWorkspace = workspaces.find((ws) => ws.id === workspace?.id);

  // switch workspace function
  function switchWorkspace(slug: string) {
    const selectedWorkspace = workspaces.find((ws) => ws.slug === slug);
    if (!selectedWorkspace) {
      toast.error("Workspace not found!");
      return;
    }

    setWorkspace({
      id: selectedWorkspace.id,
      slug: selectedWorkspace.slug,
      name: selectedWorkspace.name,
      logo: selectedWorkspace.logo,
    });

    router.push(`/${slug}`, { scroll: false });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {workspace ? (
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-muted border border-transparent hover:border-border"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square">
                  <Avatar className="size-8 rounded-none">
                    <AvatarImage
                      src={workspace.logo ?? ""}
                      className="rounded-[4px]"
                    />
                    <AvatarFallback>HA</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-sm">
                    {currWorkspace?.name}
                  </span>
                  <span className="truncate text-xs text-primary">
                    {currWorkspace?.plan}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            ) : (
              <Skeleton className="block border h-12" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((workspace, index) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => setWorkspace(workspace)}
              >
                <button
                  type="button"
                  onClick={() => switchWorkspace(workspace.slug)}
                  className="relative flex w-full items-center gap-4"
                >
                  <Avatar className="size-6 rounded-[0.2rem]">
                    <AvatarImage
                      src={workspace.logo ?? ""}
                    />
                    <AvatarFallback>XX</AvatarFallback>
                  </Avatar>
                  {workspace.name}
                  {currWorkspace === workspace && (
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
                  Add workspace
                </div>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <CreateWorkspaceModal open={open} setOpen={setOpen} />
    </SidebarMenu>
  );
}

export const CreateWorkspaceModal = ({
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
  } = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "", slug: "", description: "" },
  });
  const router = useRouter();

  const onSubmit = async (data: CreateWorkspaceValues) => {
    try {
      const slugExists = await checkWorkspaceSlug(
        data.slug.toLocaleLowerCase(),
      );
      if (slugExists) {
        setError("slug", { message: "This slug is in use" });
        return;
      }

      await createWorkspaceAction(data).then((res) => router.push(res.slug));
      setOpen(false);
      toast.success("Workspace created successfully");
    } catch (error) {
      toast.error("Failed to create workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new workspace</DialogTitle>
          <DialogDescription>
            A Workspace is a way for you to manage multiple sites keeping them
            organized.
          </DialogDescription>
        </DialogHeader>
        {/*  */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" {...register("name")} autoComplete="off" />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug">Workspace slug</Label>
            <div className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-within:ring-ring flex h-10 w-full rounded-md border px-3 text-sm focus-within:ring-2 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <span className="py-2">app.marblecms.com/</span>
              <input
                id="slug"
                placeholder="john"
                {...register("slug")}
                autoComplete="off"
                className="w-full bg-transparent py-2 pl-1 outline-none ring-0"
              />
            </div>
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="description">Workspace description</Label>
            <Textarea
              id="description"
              placeholder="My cool business workspace"
              {...register("description")}
              className="resize-none"
            />
            {errors.description && (
              <ErrorMessage>{errors.description.message}</ErrorMessage>
            )}
          </div>
          <div className="mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full gap-2"
            >
              {isSubmitting && <Loader className="size-4 animate-spin" />}
              Create Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
