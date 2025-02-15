import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be blank" }),
  email: z.string().email(),
});
export type ProfileData = z.infer<typeof profileSchema>;

export const billingSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be blank" }),
  email: z.string().email(),
  address: z.string().min(10, { message: "Address too short" }),
  country: z.string().min(1, { message: "Select a country" }),
  city: z.string().min(1, { message: "Select a city" }),
  code: z.string().min(1, { message: "Enter your zip / postal code" }),
});
export type BillingData = z.infer<typeof billingSchema>;
