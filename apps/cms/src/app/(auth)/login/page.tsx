import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import MarbleIcon from "@/components/icons/marble";
import Credits from "@/components/util/credits";

export const metadata: Metadata = {
  title: "Log In - Marble",
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const from = searchParams.from;

  return (
    <div className="h-screen w-full md:grid md:grid-cols-2">
      <section className="hidden flex-col justify-between overflow-hidden bg-[url('/textures/marble-light.avif')] bg-center bg-cover bg-no-repeat p-10 md:flex dark:bg-[url('/textures/marble-dark.avif')]">
        <div>
          <MarbleIcon />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="font-medium text-lg">
            The easiest way to manage your blog.
          </p>
          <Credits />
        </div>
      </section>
      <section className="flex h-full flex-col items-center justify-between p-4">
        <div className="self-start">
          <h1 className="sr-only font-semibold uppercase">Marble</h1>
        </div>
        <div className="flex min-w-[300px] flex-col gap-8 rounded-md p-6 lg:w-[384px] lg:px-8 lg:py-10">
          <div className="text-center">
            <h1 className="font-semibold text-xl lg:text-2xl">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Please sign-in to continue.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="px-8 text-center text-muted-foreground text-xs">
            Don&apos;t have an account?{" "}
            <Link
              className="underline underline-offset-4 hover:text-primary"
              href={
                from && from !== "/" ? `/register?from=${from}` : "/register"
              }
            >
              Register
            </Link>
          </p>
        </div>
        <div>
          <p className="text-center text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Marble. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
