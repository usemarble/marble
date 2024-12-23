import type { PostValues } from "@/lib/validations/post";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { toast } from "@repo/ui/components/sonner";
import { Textarea } from "@repo/ui/components/textarea";
import { Loader2 } from "@repo/ui/lib/icons";
import TagInput from "./tag-input";

import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";

interface PublishSettingsProps {
  control: Control<PostValues>;
  register: UseFormRegister<PostValues>;
  setValue: UseFormSetValue<PostValues>;
  errors: FieldErrors<PostValues>;
  trigger: UseFormTrigger<PostValues>;
  formRef: React.RefObject<HTMLFormElement | null>;
  isSubmitting: boolean;
  defaultCoverImage?: string | null;
}
export function PublishSettings({
  control,
  register,
  setValue,
  errors,
  formRef,
  isSubmitting,
}: PublishSettingsProps) {
  const hasErrors = Object.keys(errors).length > 0;

  const triggerSubmit = async () => {
    if (hasErrors) {
      return toast.error("Please fill in all required fields", {
        position: "top-right",
      });
    }
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm">Publish</Button>
      </SheetTrigger>
      <SheetContent className="h-[96%] right-3 top-3.5 border rounded-md">
        <SheetHeader>
          <SheetTitle>Publish settings</SheetTitle>
          <SheetDescription>
            Final touches to your article. Click publish when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <section className="grid gap-6 py-6">
          <div className="flex flex-col gap-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter a very captivating excerpt..."
              className="col-span-3"
            />
            {errors.description && (
              <p className="text-sm px-1 font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="my-awesome-post"
              className="col-span-3"
            />
            {errors.slug && (
              <p className="text-sm px-1 font-medium text-destructive">
                {errors.slug.message}
              </p>
            )}
          </div>
          <TagInput control={control} />
        </section>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" onClick={triggerSubmit} className="mt-4">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Publishing..." : "Publish article"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
