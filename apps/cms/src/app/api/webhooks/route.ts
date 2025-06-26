import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log(request);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }
}
