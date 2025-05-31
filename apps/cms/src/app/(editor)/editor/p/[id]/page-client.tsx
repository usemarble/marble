"use client";

import EditorPage from "@/components/editor/editor-page";
import type { PostValues } from "@/lib/validations/post";

interface PageClientProps {
  data: PostValues;
  id: string;
}

function PageClient({ data, id }: PageClientProps) {
  return <EditorPage initialData={data} id={id} />;
}

export default PageClient;
