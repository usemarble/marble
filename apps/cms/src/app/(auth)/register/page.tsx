import { RegisterForm } from "@/components/auth/register-form";
import { Button } from "@marble/ui/components/button";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Create Account",
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
      <section className="overflow-hidden hidden md:flex flex-col justify-between bg-muted p-10">
        <div>
          <Image
            src={"/icon.svg"}
            alt=""
            width={350}
            height={680}
            className="size-8"
          />
        </div>
        <p className="text-lg font-medium">
          The easiest way to manage your blog.
        </p>
      </section>
      <section className="flex flex-col items-center justify-between h-full p-4 md:p-10">
        <div className="self-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={from ? `/login?from=${from}` : "/login"}>Login</Link>
          </Button>
        </div>
        <div className="flex w-full max-w-96 flex-col gap-8 rounded-md p-6 lg:px-8 lg:py-10">
          <div className="text-center">
            <h1 className="text-xl font-semibold lg:text-2xl">
              Create Account
            </h1>
            <p className="text-muted-foreground text-sm">
              Choose a method below to create an account.
            </p>
          </div>

          <Suspense>
            <RegisterForm />
          </Suspense>

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
          {/* <p className="text-muted-foreground text-center text-xs">
            &copy; {new Date().getFullYear()} Marble. All rights reserved.
          </p> */}
        </div>
      </section>
    </div>
  );
}
