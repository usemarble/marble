import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login",
};
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LoginPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const from = searchParams.from;

  return (
    <div className="md:grid h-screen w-full md:grid-cols-[55%,45%] p-4 max-w-screen-xl mx-auto">
      <section className="flex flex-col items-center justify-between h-full">
        <div className="self-start">
          <h1 className="font-semibold uppercase sr-only">Marble</h1>
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

          <p className="text-muted-foreground px-8 text-center text-xs">
            Don&apos;t have an account?{" "}
            <Link
              href={from ? `/register?from=${from}` : "/register"}
              className="hover:text-primary underline underline-offset-4 block"
            >
              Register
            </Link>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-center text-xs">
            &copy; {new Date().getFullYear()} Marble. All rights reserved.
          </p>
        </div>
      </section>
      <section className="overflow-hidden rounded-md hidden md:block">
        <Image
          src={"/login.jpg"}
          alt=""
          width={350}
          height={680}
          className="w-full h-full"
        />
      </section>
    </div>
  );
}
