import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(html("Authorization Failed", "Something went wrong. You can close this tab."), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Exchange code for tokens
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: `${appUrl}/api/gmail/oauth/callback`,
      grant_type: "authorization_code",
    }),
  });

  const data = await response.json();

  if (data.error) {
    return new NextResponse(html("Authorization Failed", `Google error: ${data.error}`), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Store tokens in KV with 5-minute TTL
  await kv.set(`pact:${state}`, {
    platform: "gmail",
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type,
  }, { ex: 300 });

  return new NextResponse(
    html("Pact Connected to Gmail!", "You can close this tab and return to your terminal."),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function html(title: string, message: string): string {
  return `<!DOCTYPE html>
<html><head><title>${title}</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#ededed}
.card{text-align:center;padding:2rem}h1{margin-bottom:0.5rem}p{color:#888}</style>
</head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}
