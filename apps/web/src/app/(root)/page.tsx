import Container from "@/components/container";
import { Button } from "@repo/ui/components/button";
import { ArrowRight } from "@repo/ui/lib/icons";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Container>
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
        <section className="grid place-items-center py-12 md:py-16 lg:py-28">
          <div>
            <div className="relative mx-auto flex flex-col items-center text-center lg:items-start">
              <h1 className="relative text-balance text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl max-w-5xl">
                Super simple{" "}
                <span className="bg-foreground text-background px-1 ml-1 md:ml-1.5 whitespace-nowrap inline-block transform -rotate-2 origin-center leading-[1.2] -mt-[0.1em] -mb-[0.1em]">
                  AI powered
                </span>{" "}
                blog CMS for everyone.
              </h1>
              <p className="lg:text-lef mx-auto mt-8 max-w-prose text-balance text-center text-lg text-foreground-500 md:text-wrap font-medium">
                Set up your blog in minutes with Tiles. No more fiddling with
                complex CMS or worrying about hosting. Just write and publish.
              </p>
            </div>
            <div className="mt-8 flex w-full items-center justify-center">
              <div>
                <Button
                  size="lg"
                  className="flex items-center py-2 text-sm hover:ring-offset-2 hover:ring-primary hover:ring-2 transition-all duration-300 ease-out px-8 group"
                  asChild
                >
                  <Link href={"/"}>
                    <span>Set up your blog</span>
                    <ArrowRight className="size-4 translate-x-1 group-focus-visible:translate-x-2 group-hover:translate-x-2 transition duration-300" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
