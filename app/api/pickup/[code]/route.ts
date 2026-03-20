import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const key = `pact:${code}`;
  const data = await redis.get<string>(key);

  if (!data) {
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }

  // Delete after pickup — one-time use
  await redis.del(key);

  const tokens = typeof data === "string" ? JSON.parse(data) : data;
  return NextResponse.json({ status: "ready", tokens });
}
