"use client";

import { buttonVariants } from "@marble/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { cn } from "@marble/ui/lib/utils";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { invoiceTableColumns } from "@/components/invoice/columns";
import { InvoiceDataTable } from "@/components/invoice/data-table";
import Container from "@/components/shared/container";

function PageClient() {
  return (
    <Container className="py-4 w-full">
      <header className="flex items-center gap-2 justify-between">
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="size-4" />
          <span>Dashboard</span>
        </Link>
        <h1 className="text-lg font-medium">Billing Settings</h1>
      </header>
      <section className="py-10 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>
              You are currently on the free plan.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end border-t py-4">
            <Link
              href="/settings/billing/upgrade"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Change Plan
            </Link>
          </CardFooter>
        </Card>
      </section>
      <section className="py-10 max-w-3xl mx-auto">
        <Card className="border-none">
          <CardHeader className="px-0 pb-0">
            <CardTitle>Invoices</CardTitle>
            <CardDescription>All your invoices.</CardDescription>
          </CardHeader>
          <InvoiceDataTable data={[]} columns={invoiceTableColumns} />
        </Card>
      </section>
    </Container>
  );
}

export default PageClient;
