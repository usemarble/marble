"use client";
import Container from "@/components/shared/container";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { cn } from "@marble/ui/lib/utils";
import Link from "next/link";

function PageClient() {
  return (
    <Container className="py-4 w-full">
      <section className="flex items-center gap-2 justify-between">
        <h1 className="text-lg font-medium">Billing Settings</h1>
        <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
          Dashboard
        </Link>
      </section>
      <section className="py-10 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>
              You are currently on the free plan.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end border-t py-4">
            <Button variant="outline">Upgrade</Button>
          </CardFooter>
        </Card>
      </section>
    </Container>
  );
}

export default PageClient;
