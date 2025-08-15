import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import MarbleIcon from "@/components/icons/marble";
import Credits from "@/components/util/credits";

export const metadata: Metadata = {
  title: "Reset Password - Marble",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const token = searchParams.token as string;

  if (!token) {
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
        <section className="flex flex-col items-center justify-between h-full p-4">
          <div className="self-start">
            <h1 className="font-semibold uppercase sr-only">Marble</h1>
          </div>
          <div className="flex min-w-[300px] flex-col gap-8 rounded-md p-6 lg:w-[384px] lg:px-8 lg:py-10">
            <div className="text-center">
              <h1 className="text-xl font-semibold lg:text-2xl">
                Invalid reset link
              </h1>
              <p className="text-muted-foreground text-sm">
                This password reset link is invalid or has expired.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                Please request a new password reset link to continue.
              </p>
            </div>

            <p className="text-muted-foreground px-8 text-center text-xs">
              <Link
                href="/forgot"
                className="hover:text-primary underline underline-offset-4"
              >
                Request new reset link
              </Link>{" "}
              or{" "}
              <Link
                href="/login"
                className="hover:text-primary underline underline-offset-4"
              >
                Sign in
              </Link>
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
      <section className="flex flex-col items-center justify-between h-full p-4">
        <div className="self-start">
          <h1 className="font-semibold uppercase sr-only">Marble</h1>
        </div>
        <div className="flex min-w-[300px] flex-col gap-8 rounded-md p-6 lg:w-[384px] lg:px-8 lg:py-10">
          <div className="text-center">
            <h1 className="text-xl font-semibold lg:text-2xl">
              Reset your password
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your new password below.
            </p>
          </div>

          <Suspense>
            <ResetPasswordForm token={token} />
          </Suspense>

          <p className="text-muted-foreground px-8 text-center text-xs">
            Remember your password?{" "}
            <Link
              href="/login"
              className="hover:text-primary underline underline-offset-4"
            >
              Sign in
            </Link>
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
