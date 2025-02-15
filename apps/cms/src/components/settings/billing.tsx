import { type BillingData, billingSchema } from "@/lib/validations/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { Separator } from "@marble/ui/components/separator";
import { toast } from "@marble/ui/components/sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CountryDropdown } from "../ui/country-dropdown";

interface BillingFormProps {
  email: string;
  name: string;
  id: string;
}

function BillingForm({ name, email, id }: BillingFormProps) {
  const {
    watch,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BillingData>({
    resolver: zodResolver(billingSchema),
    defaultValues: { name: name || "", email: email || "" },
  });

  const [dataChanged, setDataChanged] = useState(false);
  const router = useRouter();

  const onSubmit = async (formData: BillingData) => {
    try {
      toast.success("In development");
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
      <section className="space-y-8">
        <div className="grid gap-6 grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">Country</Label>
            <CountryDropdown
              placeholder="Select country"
              defaultValue="NGA"
              onChange={() => console.log("country changed")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Zip / Postal code</Label>
          <Input id="code" {...register("code")} />
        </div>
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

export default BillingForm;
