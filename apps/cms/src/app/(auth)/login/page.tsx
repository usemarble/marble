import { Separator } from "@marble/ui/components/separator";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import MarbleIcon from "@/components/icons/marble";
import Credits from "@/components/util/credits";
import { SITE_CONFIG } from "@/utils/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: "Log In - Marble",
  alternates: {
    canonical: "/login",
  },
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
      <section className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex">
        <Image
          src="/textures/marble-light.avif"
          alt="Light marble texture background"
          fill
          className="object-cover object-center dark:hidden"
          loading="lazy"
          unoptimized
          quality={100}
        />
        <Image
          src="/textures/marble-dark.avif"
          alt="Dark marble texture background"
          fill
          className="hidden object-cover object-center dark:block"
          loading="lazy"
          unoptimized
          quality={100}
        />
        <div className="relative z-10">
          <MarbleIcon />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <p className="text-lg font-medium">
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
            <h1 className="text-xl font-semibold lg:text-2xl">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Please sign-in to continue.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <div className="text-muted-foreground flex flex-col gap-4 px-8 text-center text-xs">
            <p>
              Forgot your password?{" "}
              <Link
                href={
                  from && from !== "/reset" ? `/reset?from=${from}` : "/reset"
                }
                className="hover:text-primary underline underline-offset-4"
              >
                Reset Your Password
              </Link>
            </p>

            <Separator />

            <p>
              Don&apos;t have an account?{" "}
              <Link
                href={
                  from && from !== "/" ? `/register?from=${from}` : "/register"
                }
                className="hover:text-primary underline underline-offset-4"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground px-8 text-center text-xs">
            By continuing, you agree to our{" "}
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
      </section>
    </div>
  );
}
