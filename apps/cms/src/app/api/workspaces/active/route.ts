import { NextResponse } from "next/server";
import { setActiveWorkspace } from "@/lib/auth/workspace";
import { setServerLastVisitedWorkspace } from "@/utils/workspace/server";

export async function POST(req: Request) {
  const { slug } = await req.json();

  await setActiveWorkspace(slug);
  await setServerLastVisitedWorkspace(slug);

  return NextResponse.json({ success: true });
}
