"use client";

import { ErrorMessage } from "@/components/auth/error-message";
import { checkWorkspaceSlug } from "@/lib/actions/workspace";
import { organization } from "@/lib/auth/client";
import { type OnboardingData, onboardingSchema } from "@/lib/validations/auth";
import { generateSlug } from "@/utils/generate-slug";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

function PageClient() {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
  });

  const router = useRouter();
    const { name } = watch();
  
    useEffect(() => {
      if (name) {
        const slug = generateSlug(name);
        setValue("slug", slug);
      }
    }, [name, setValue]);

  async function onSubmit(data: OnboardingData) {
    const slugExists = await checkWorkspaceSlug(data.slug);
    if (slugExists) {
      setError("slug", { message: "This slug is in use" });
      return;
    }

    try {
      const response = await organization.create({
        name: data.name,
        slug: data.slug,
        logo: `https://api.dicebear.com/9.x/glass/svg?seed=${data.name}`,
      });

      if (response.data) {
        await organization.setActive({
          organizationId: response.data.id,
        });

        router.push(`/${response.data.slug}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create workspace");
    }
  }
  return (
    <div>
      <Card className="w-96">
        <CardHeader className="text-center mb-5">
          <CardTitle>Create your workspace</CardTitle>
          <CardDescription>
            A workspace is a collection of your articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Name of your workspace"
                {...register("name")}
              />
              {errors.name && (
                <ErrorMessage>{errors.name.message}</ErrorMessage>
              )}
            </div>
            <div className="grid flex-1 gap-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex w-full rounded-md border border-input bg-background text-base placeholder:text-muted-foreground focus-within:outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden">
                <span className="py-2.5 px-2 bg-gray-100 border-r">
                  app.marblecms.com/
                </span>
                <input
                  id="slug"
                  placeholder="john"
                  {...register("slug")}
                  autoComplete="off"
                  className="w-full bg-transparent py-2 px-2 outline-none ring-0"
                />
              </div>
              {errors.slug && (
                <ErrorMessage>{errors.slug.message}</ErrorMessage>
              )}
            </div>
            <div className="mt-5">
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
        </CardContent>
      </Card>
    </div>
  );
}

export default PageClient;
