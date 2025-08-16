import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import MarbleIcon from "@/components/icons/marble";
import Credits from "@/components/util/credits";

export const metadata: Metadata = {
  title: "Forgot Password - Marble",
};

export default function ForgotPasswordPage() {
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
              Forgot your password?
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <Suspense>
            <ForgotPasswordForm />
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
