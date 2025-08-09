import { Separator } from "@marble/ui/components/separator";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import MarbleIcon from "@/components/icons/marble";
import Credits from "@/components/util/credits";

export const metadata: Metadata = {
  title: "Sign Up - Marble",
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const from = searchParams.from;

  return (
    <div className="md:grid h-screen w-full md:grid-cols-2">
      <section className="hidden md:flex flex-col justify-between p-10 overflow-hidden bg-cover bg-center bg-no-repeat bg-[url('/textures/marble-light.avif')] dark:bg-[url('/textures/marble-dark.avif')]">
        <div>
          <MarbleIcon />
        </div>
        <div className="flex items-center gap-4 justify-between">
          <p className="text-lg font-medium">
            The easiest way to manage your blog.
          </p>
          <Credits />
        </div>
      </section>
      <section className="flex flex-col items-center justify-between h-full p-4 md:p-10">
        <div className="flex w-full max-w-96 flex-col gap-8 rounded-md p-6 lg:px-8 lg:py-10">
          <div className="text-center">
            <h1 className="text-xl font-semibold lg:text-2xl">
              Create Account
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign up to get started.
            </p>
          </div>

          <Suspense>
            <RegisterForm />
          </Suspense>

          <p className="text-muted-foreground px-8 text-center text-xs">
            Already have an account?{" "}
            <Link
              href={from && from !== "/" ? `/login?from=${from}` : "/login"}
              className="hover:text-primary underline underline-offset-4"
            >
              Login
            </Link>
          </p>

          <Separator />

          <p className="text-muted-foreground px-8 text-center text-xs">
            By signing up, you agree to our{" "}
            <Link
              href="https://marblecms.com/terms"
              target="_blank"
              className="hover:text-primary underline underline-offset-4"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="https://marblecms.com/privacy"
              target="_blank"
              className="hover:text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-center text-xs">
            &copy; {new Date().getFullYear()} Marble. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
