import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { incrementViews } from "@/lib/cache";
import { assertViewsSaltInProduction, env } from "@/lib/env";
import { parseRepoInput } from "@/lib/repo";

const EXAMPLE_REPOS = new Set([
  "vercel/next.js",
  "supabase/supabase",
  "tailwindlabs/tailwindcss",
]);

function extractVisitorIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    assertViewsSaltInProduction();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const body = (await request.json()) as { repo?: string };
  const parsed = parseRepoInput(body.repo ?? "");

  if (!parsed) {
    return NextResponse.json({ error: "Invalid repository format." }, { status: 400 });
  }

  const key = `${parsed.owner.toLowerCase()}/${parsed.repo.toLowerCase()}`;
  if (EXAMPLE_REPOS.has(key)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const ip = extractVisitorIp(request);
  const ipHash = createHash("sha256")
    .update(`${env.viewsIpSalt ?? "dev-salt"}:${ip}`)
    .digest("hex");

  await incrementViews(parsed.owner, parsed.repo, ipHash);

  return NextResponse.json({ ok: true });
}
