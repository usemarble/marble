"use client";

import { DashboardBody } from "@/components/layout/wrapper";
import { Enable } from "@/components/settings/fields/enable";

function PageClient() {
  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <Enable />
    </DashboardBody>
  );
}

export default PageClient;
