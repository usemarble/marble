import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkoutId = searchParams.get("checkout_id");

  console.log("Checkout ID", checkoutId);

  return NextResponse.redirect(
    new URL("/settings/billing", process.env.NEXT_PUBLIC_APP_URL),
  );
}
