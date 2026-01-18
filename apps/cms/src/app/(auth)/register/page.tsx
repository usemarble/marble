import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import MarbleIcon from "@/components/icons/marble";
import { SITE_CONFIG } from "@/utils/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: "Sign Up - Marble",
  description: "Create a new Marble account to start managing your blog.",
  alternates: {
    canonical: "/register",
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const from = searchParams.from;

  return (
    <div className="h-screen w-full md:grid md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-surface p-6 md:flex">
        <div>
          <MarbleIcon />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="font-medium text-lg">
            The easiest way to manage your blog.
          </p>
        </div>
      </section>
      <section className="flex h-full flex-col items-center justify-between p-6">
        <div className="self-start">
          <h1 className="sr-only">Register for an account</h1>
        </div>
        <div className="flex min-w-[300px] flex-col gap-8 rounded-md p-6 lg:w-[384px] lg:px-8 lg:py-10">
          <div className="text-center">
            <p className="font-semibold text-xl lg:text-2xl">Create Account</p>
            <p className="text-muted-foreground text-sm">
              Sign up to get started.
            </p>
          </div>

          <Suspense>
            <RegisterForm />
          </Suspense>

          <p className="px-8 text-center text-muted-foreground text-xs">
            Already have an account?{" "}
            <Link
              className="underline underline-offset-2 hover:text-primary"
              href={from && from !== "/" ? `/login?from=${from}` : "/login"}
            >
              Login
            </Link>
          </p>
        </div>
        <div>
          <p className="px-8 text-center text-muted-foreground text-xs">
            By continuing, you agree to our{" "}
            <Link
              className="underline underline-offset-2 hover:text-primary"
              href="https://marblecms.com/terms"
              target="_blank"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              className="underline underline-offset-2 hover:text-primary"
              href="https://marblecms.com/privacy"
              target="_blank"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
