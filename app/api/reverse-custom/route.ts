import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";
import { NextRequest, NextResponse } from "next/server";
import {
  focusFingerprint,
  getCustomPromptCache,
  setCustomPromptCache,
  getPromptCache,
  setPromptCache,
} from "@/lib/cache";
import { env } from "@/lib/env";
import { getInFlightMap } from "@/lib/inflight";
import { parseRepoInput, repoKey } from "@/lib/repo";
import type { ReverseResult } from "@/lib/types";

export const maxDuration = 900;

type CustomPayload = {
  repo?: string;
  focus?: string;
  mode?: "custom" | "deep";
};

function proxyToBackend(payload: { owner: string; repo: string; focus?: string; mode: "custom" | "deep" }) {
  return new Promise<string>((resolve, reject) => {
    const base = new URL(env.externalReverseUrl);
    const target = new URL("/reverse-custom", base);
    const reqImpl = target.protocol === "https:" ? httpsRequest : httpRequest;

    const req = reqImpl(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => {
          chunks.push(Buffer.from(chunk));
        });

        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");

          if ((res.statusCode ?? 500) >= 400) {
            reject(new Error(raw || `External reverse service error (${res.statusCode}).`));
            return;
          }

          try {
            const parsed = JSON.parse(raw) as { prompt?: string };
            if (!parsed.prompt) {
              reject(new Error("External reverse service returned no prompt."));
              return;
            }
            resolve(parsed.prompt);
          } catch {
            reject(new Error("External reverse service returned invalid JSON."));
          }
        });
      },
    );

    req.setTimeout(15 * 60 * 1000, () => {
      req.destroy(new Error("External reverse request timed out after 15 minutes."));
    });

    req.on("error", reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CustomPayload;
  const parsed = parseRepoInput(body.repo ?? "");

  if (!parsed) {
    return NextResponse.json({ error: "Invalid repository format." }, { status: 400 });
  }

  const mode = body.mode ?? "custom";
  const focus = (body.focus ?? "").trim();
  if (mode === "custom" && !focus) {
    return NextResponse.json({ error: "Focus instructions are required in manual mode." }, { status: 400 });
  }

  const fingerprint = focusFingerprint(mode === "deep" ? "__deep__" : focus);
  const inFlightKey = `${repoKey(parsed.owner, parsed.repo)}:${fingerprint}`;
  const inFlight = getInFlightMap("custom");

  if (inFlight.has(inFlightKey)) {
    const existing = await inFlight.get(inFlightKey)!;
    return NextResponse.json(existing);
  }

  const promise = (async (): Promise<ReverseResult> => {
    const customCached = await getCustomPromptCache(parsed.owner, parsed.repo, fingerprint);
    if (customCached) {
      return customCached;
    }

    const prompt = await proxyToBackend({
      owner: parsed.owner,
      repo: parsed.repo,
      focus: mode === "custom" ? focus : undefined,
      mode,
    });

    const result: ReverseResult = {
      owner: parsed.owner,
      repo: parsed.repo,
      prompt,
      sourceUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
      createdAt: new Date().toISOString(),
    };

    void setCustomPromptCache(parsed.owner, parsed.repo, fingerprint, prompt, result.sourceUrl);
    if (mode === "deep") {
      void setPromptCache(result);
    }

    const baseCache = await getPromptCache(parsed.owner, parsed.repo);
    if (!baseCache) {
      void setPromptCache(result);
    }

    return result;
  })();

  inFlight.set(inFlightKey, promise);

  try {
    const result = await promise;
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Custom reverse generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    inFlight.delete(inFlightKey);
  }
}
