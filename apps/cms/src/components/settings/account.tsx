import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import { Checkbox } from "@marble/ui/components/checkbox";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { Separator } from "@marble/ui/components/separator";
import { toast } from "@marble/ui/components/sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type ProfileData, profileSchema } from "@/lib/validations/settings";
import { useUser } from "@/providers/user";
import { ErrorMessage } from "../auth/error-message";

type AccountFormProps = {
  email: string;
  name: string;
};

function AccountForm({ name, email }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: name || "", email: email || "" },
  });

  const [dataChanged, setDataChanged] = useState(false);
  const router = useRouter();
  const { updateUser } = useUser();

  const onSubmit = async (formData: ProfileData) => {
    try {
      await updateUser(formData);
      toast.success("Account details updated");
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    const dataSubscription = watch((value) => {
      setDataChanged(value.name !== name);
    });

    return () => {
      dataSubscription.unsubscribe();
    };
  }, [watch, name]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="grid gap-6 grid-cols-2 mt-5">
        <div className="flex flex-col gap-2">
          <Label>Name</Label>
          <Input {...register("name")} />
          {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Email</Label>
          <Input
            {...register("email")}
            readOnly
            className="cursor-not-allowed"
          />
          {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
        </div>
      </section>
      <Separator />
      <section className="space-y-8">
        <div>
          <h1 className="text-lg font-semibold">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            Manage your personal notification settings for this workspace. Read
            the governance documentation to learn more.
          </p>
        </div>
        <ul className="flex flex-col gap-6">
          <li className="flex gap-4">
            <Checkbox id="newsletter" checked disabled />{" "}
            <div className="flex flex-col gap-2">
              <Label htmlFor="newsletter">Receive newsletter</Label>
              <p className="text-muted-foreground text-sm">
                I want to receive updates about relevant products or services.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <Checkbox id="member" />{" "}
            <div className="flex flex-col gap-2">
              <Label htmlFor="member">Member activities</Label>
              <p className="text-muted-foreground text-sm">
                Stay informed and receive notifications when team members join
                or leave this workspace.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <Checkbox id="publish" />{" "}
            <div className="flex flex-col gap-2">
              <Label htmlFor="publish">Publishing activities</Label>
              <p className="text-muted-foreground text-sm">
                Receive notifications when scheduled articles are published.
              </p>
            </div>
          </li>
        </ul>
      </section>
      <Separator />
      <section className="flex gap-4 justify-end w-full">
        <Button
          disabled={!dataChanged || isSubmitting}
          className="w-20 self-end flex gap-2 items-center"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Save"}
        </Button>
      </section>
    </form>
  );
}

export default AccountForm;
