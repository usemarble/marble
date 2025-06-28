"use client";
import { Button } from "@marble/ui/components/button";
import { ArrowLeft } from "@phosphor-icons/react";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Container from "@/components/shared/container";

function PageClient() {
  const router = useRouter();
  return (
    <Container className="py-4 w-full">
      <header className="flex items-center gap-2 justify-between">
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </Button>
        <h1 className="text-lg font-medium">Plans</h1>
      </header>
      <section className="mt-10">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 border divide-x divide-dashed rounded-xl overflow-hidden">
          <li className=" flex flex-col gap-5 min-h-96 h-full w-full px-4 py-6">
            <div className="flex flex-col gap-4">
              <h4 className="text-medium text-2xl">Hobby</h4>
              <div className="">
                <p>
                  <span className="font-bold text-2xl">$0</span>{" "}
                  <span>per month.</span>
                </p>
                <p className="text-muted-foreground text-sm">
                  For solo individuals
                </p>
              </div>
            </div>
            <div className="border-y border-dashed py-4">
              <Button className="w-full">
                <span>Downgrade</span>
              </Button>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>Single workspace.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>Unlimited posts.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>500 MB media storage.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>Up to 3 team members.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>10k API requests per month.</span>
              </li>
            </ul>
          </li>
          <li className=" flex flex-col gap-5 min-h-96 h-full w-full px-4 py-6">
            <div className="flex flex-col gap-4">
              <h4 className="text-medium text-2xl">Pro</h4>
              <div className="">
                <p>
                  <span className="font-bold text-2xl">$10</span>{" "}
                  <span>per month.</span>
                </p>
                <p className="text-muted-foreground text-sm">
                  For individuals managing multiple projects
                </p>
              </div>
            </div>
            <div className="border-y border-dashed py-4">
              <Button className="w-full">Upgrade</Button>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>Up to 5 workspaces.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>Unlimited posts.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>2 GB media storage.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>10 Members per workspace</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>50k API requests per month.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>50 Webhook events per month.</span>
              </li>
            </ul>
          </li>
          <li className=" flex flex-col sm:col-span-2 sm:border-t sm:border-dashed lg:border-t-0 lg:col-span-1 sm:flex-row sm:px-14 sm:py-10 lg:py-6 sm:justify-center sm:gap-20 lg:gap-4 lg:px-4 lg:flex-col gap-5 min-h-96 sm:min-h-fit lg:min-h-96 w-full px-4 py-6">
            <div className="flex flex-col gap-5 sm:min-w-60 lg:min-w-0">
              <div className="flex flex-col gap-4">
                <h4 className="text-medium text-xl text-medium">Team</h4>
                <div className="">
                  <p>
                    <span className="font-bold text-2xl">$15</span>{" "}
                    <span>per month.</span>
                  </p>
                  <p className="text-muted-foreground text-sm">
                    For growing teams and small organizations
                  </p>
                </div>
              </div>
              <div className="border-y border-dashed py-4">
                <Button className="w-full">Upgrade</Button>
              </div>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>Up to 10 workspaces.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>Unlimited posts.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>10 GB media storage.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>15 members per workspace</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>Unlimited API requests.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-primary" />
                <span>100 Webhook events per month.</span>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </Container>
  );
}

export default PageClient;
