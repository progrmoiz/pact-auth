import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

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

  // Exchange code for token
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    return new NextResponse(html("Authorization Failed", `GitHub error: ${data.error_description || data.error}`), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Store token in KV with 5-minute TTL
  await redis.set(`pact:${state}`, JSON.stringify({
    platform: "github",
    access_token: data.access_token,
    token_type: data.token_type,
    scope: data.scope,
  }), { ex: 300 });

  return new NextResponse(
    html("Pact Connected to GitHub!", "You can close this tab and return to your terminal."),
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
