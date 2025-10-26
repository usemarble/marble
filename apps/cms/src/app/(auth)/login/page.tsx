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

type PageProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage(props: PageProps) {
	const searchParams = await props.searchParams;
	const from = searchParams.from;

	return (
		<div className="h-screen w-full md:grid md:grid-cols-2">
			<section className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex">
				<Image
					alt="Light marble texture background"
					className="object-cover object-center dark:hidden"
					fill
					loading="lazy"
					quality={100}
					src="/textures/marble-light.avif"
					unoptimized
				/>
				<Image
					alt="Dark marble texture background"
					className="hidden object-cover object-center dark:block"
					fill
					loading="lazy"
					quality={100}
					src="/textures/marble-dark.avif"
					unoptimized
				/>
				<div className="relative z-10">
					<MarbleIcon />
				</div>
				<div className="relative z-10 flex items-center justify-between gap-4">
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

					<div className="flex flex-col gap-4 px-8 text-center text-muted-foreground text-xs">
						<p>
							Forgot your password?{" "}
							<Link
								className="underline underline-offset-4 hover:text-primary"
								href={
									from && from !== "/reset" ? `/reset?from=${from}` : "/reset"
								}
							>
								Reset Your Password
							</Link>
						</p>

						<Separator />

						<p>
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
				</div>
				<div>
					<p className="px-8 text-center text-muted-foreground text-xs">
						By continuing, you agree to our{" "}
						<Link
							className="underline underline-offset-4 hover:text-primary"
							href="https://marblecms.com/terms"
							target="_blank"
						>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link
							className="underline underline-offset-4 hover:text-primary"
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
