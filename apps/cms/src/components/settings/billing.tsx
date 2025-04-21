import { type BillingData, billingSchema } from "@/lib/validations/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
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
import { Separator } from "@marble/ui/components/separator";
import { toast } from "@marble/ui/components/sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CountryDropdown } from "../ui/country-dropdown";
import { DeleteWorkspaceModal } from "./delete-workspace-modal";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Billing information.</CardTitle>
        <CardDescription className="sr-only">
          Update your billing information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <section className="space-y-8">
            <div className="grid gap-6 grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="sr-only">
                  Name
                </Label>
                <Input id="name" {...register("name")} placeholder="Name" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input id="email" {...register("email")} placeholder="Email" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="country" className="sr-only">
                  Country
                </Label>
                <CountryDropdown
                  placeholder="Select country"
                  onChange={() => console.log("country changed")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="city" className="sr-only">
                  City
                </Label>
                <Input id="city" {...register("city")} placeholder="City" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address" className="sr-only">
                Address
              </Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Address"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="code" className="sr-only">
                Zip / Postal code
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="Zip / Postal code"
              />
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              disabled={!dataChanged || isSubmitting}
              className="w-20 self-end flex gap-2 items-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default BillingForm;
