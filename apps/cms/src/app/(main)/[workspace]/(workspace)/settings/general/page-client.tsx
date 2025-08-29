"use client";

import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { Delete } from "@/components/settings/fields/delete";
import { Id } from "@/components/settings/fields/id";
import { Logo } from "@/components/settings/fields/logo";
import { Name } from "@/components/settings/fields/name";
import { Slug } from "@/components/settings/fields/slug";
import { Timezone } from "@/components/settings/fields/timezone";

function PageClient() {
  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 py-12">
      <Name />
      <Slug />
      <Logo />
      <Timezone />
      <Id />
      <Delete />
    </WorkspacePageWrapper>
  );
}

export default PageClient;
