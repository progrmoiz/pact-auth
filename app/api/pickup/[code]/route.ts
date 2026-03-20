import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const key = `pact:${code}`;
  const data = await kv.get(key);

  if (!data) {
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }

  // Delete after pickup — one-time use
  await kv.del(key);

  return NextResponse.json({ status: "ready", tokens: data });
}
