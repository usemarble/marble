"use client";

import { Check, ChevronsUpDown, Loader, Plus } from "@repo/ui/lib/icons";
import { useEffect, useState } from "react";

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
import { checkWorkspaceSlug } from "@/lib/actions/workspace";
import {
  organization,
  useActiveOrganization,
  useListOrganizations,
  useSession,
} from "@/lib/auth/client";
import type {
  ActiveOrganization,
  Organization,
  Session,
} from "@/lib/auth/types";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/generate-slug";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface WorkspaceSwitcherProps {
  session: Session | null;
  activeOrganization: ActiveOrganization | null;
}

export function WorkspaceSwitcher(props: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const organizations = useListOrganizations();
  const [optimisticOrg, setOptimisticOrg] = useState<ActiveOrganization | null>(
    props.activeOrganization,
  );
  const { data } = useSession();
  const session = data || props.session;
  const currOrg = useActiveOrganization();

  // console.log("organizations", organizations.data);
  // console.log("active org", currOrg.data);
  useEffect(() => {
    if (currOrg.data) {
      setOptimisticOrg(currOrg.data);
    }
  }, [currOrg.data]);

  async function switchWorkspace(org: Organization) {
    if (org.slug === optimisticOrg?.slug) {
      return;
    }

    setOptimisticOrg({
      members: [],
      invitations: [],
      ...org,
    });

    const { data } = await organization.setActive({
      organizationSlug: org.slug,
    });

    setOptimisticOrg(data);

    router.push(`/${org.slug}`, { scroll: false });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {optimisticOrg ? (
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-muted border border-transparent hover:border-border"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square">
                  <Avatar className="size-8 rounded-none">
                    <AvatarImage
                      src={optimisticOrg.logo ?? ""}
                      className="rounded-[4px]"
                    />
                    <AvatarFallback>HA</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-sm">
                    {optimisticOrg?.name || "Personal"}
                  </span>
                  <span className="truncate text-xs text-primary">
                    {optimisticOrg?.members.length || 1} members
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
            {organizations.data?.map((org: Organization) => (
              <DropdownMenuItem key={org.id}>
                <button
                  type="button"
                  onClick={() => switchWorkspace(org)}
                  className="relative flex w-full items-center gap-4"
                >
                  <Avatar className="size-6 rounded-[0.2rem]">
                    <AvatarImage src={org.logo ?? ""} />
                    <AvatarFallback>XX</AvatarFallback>
                  </Avatar>
                  {org.name}
                  {optimisticOrg?.id === org.id && (
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
    watch,
    setError,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "" },
  });
  const router = useRouter();
  const { name } = watch();

  useEffect(() => {
    if (name) {
      const slug = generateSlug(name);
      setValue("slug", slug);
    }
  }, [name, setValue]);

  const onSubmit = async (data: CreateWorkspaceValues) => {
    try {
      const slugExists = await checkWorkspaceSlug(data.slug);
      if (slugExists) {
        // This check is now correct - if true, the slug is in use
        setError("slug", { message: "This slug is in use" });
        return;
      }

      const response = await organization.create({
        name: data.name,
        slug: data.slug,
        logo: `https://avatar.vercel.sh/${data.name}.svg?text=${data.name.split(" ")[0]?.slice(0, 1)}W`,
      });

      if (response.data) {
        await organization.setActive({
          organizationId: response.data.id,
        });
        setOpen(false);
        router.push(`/${response.data.slug}`);
      }
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
            <div className="flex w-full rounded-md border border-input bg-background text-base placeholder:text-muted-foreground focus-within:outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden">
              <span className="py-2.5 px-2 bg-gray-100 border-r">
                app.marblecms.com/
              </span>
              <input
                id="slug"
                {...register("slug")}
                defaultValue={generateSlug(name)}
                className="w-full bg-transparent py-2 outline-none ring-0 pl-2"
              />
            </div>
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
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
