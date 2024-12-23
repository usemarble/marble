import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  return (
    <div className="grid min-h-screen w-full place-content-center p-4">
      <div className="flex min-w-[300px] flex-col gap-8 rounded-md p-6 lg:w-[384px] lg:px-8 lg:py-10">
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-semibold lg:text-2xl">Login</h1>
          <p className="text-muted-foreground text-center text-sm">
            Choose a sign-in method below to continue.
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="text-muted-foreground px-8 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="hover:text-primary underline underline-offset-4"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
