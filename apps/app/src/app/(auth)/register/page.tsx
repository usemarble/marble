import { RegisterForm } from "@/components/auth/register-form";
import { AcmeLogo } from "@/components/shared/icons";
import getSession from "@/lib/auth/get-session";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");
  return (
    <div className="grid min-h-screen w-full place-content-center p-4">
      <div className="flex min-w-[300px] flex-col gap-8 rounded-md p-6 lg:w-[384px] lg:px-8 lg:py-10">
        <div className="flex flex-col items-center gap-4 leading-3">
          {/* <div>
            <AcmeLogo className="text-primary" size={40} />
          </div> */}

          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold lg:text-2xl">
              Create account
            </h1>
            <p className="text-muted-foreground text-center text-sm">
              Choose a sign-up method below to create an account.
            </p>
          </div>
        </div>

        <RegisterForm />

        <p className="text-muted-foreground px-8 text-center text-sm">
          By clicking continue, you agree to our{" "}
          <Link
            href="/terms"
            className="hover:text-primary underline underline-offset-4"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="hover:text-primary underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
