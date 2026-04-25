import { NextRequest, NextResponse } from "next/server";
import { getPromptCache, setPromptCache } from "@/lib/cache";
import { fetchRepoArtifacts, classifyGithubError } from "@/lib/github";
import { getInFlightMap } from "@/lib/inflight";
import { generatePromptFromRepo, classifyLlmError } from "@/lib/llm";
import { parseRepoInput, repoKey } from "@/lib/repo";
import type { ReverseResult } from "@/lib/types";

class RouteError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RouteError";
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { repo?: string };
  const parsed = parseRepoInput(body.repo ?? "");

  if (!parsed) {
    return NextResponse.json({ error: "Invalid repository format." }, { status: 400 });
  }

  const key = repoKey(parsed.owner, parsed.repo);
  const inFlight = getInFlightMap("reverse");

  if (inFlight.has(key)) {
    const result = await inFlight.get(key)!;
    return NextResponse.json(result);
  }

  const promise = (async (): Promise<ReverseResult> => {
    const cached = await getPromptCache(parsed.owner, parsed.repo);
    if (cached) {
      return cached;
    }

    let artifacts;
    try {
      artifacts = await fetchRepoArtifacts(parsed.owner, parsed.repo);
    } catch (error) {
      const classified = classifyGithubError(error);
      throw new RouteError(classified.status, classified.message);
    }

    let prompt: string;
    try {
      prompt = await generatePromptFromRepo(artifacts);
    } catch (error) {
      const classified = classifyLlmError(error);
      throw new RouteError(classified.status, classified.message);
    }

    const result: ReverseResult = {
      owner: artifacts.metadata.owner,
      repo: artifacts.metadata.repo,
      prompt,
      sourceUrl: artifacts.metadata.htmlUrl,
      createdAt: new Date().toISOString(),
    };

    void setPromptCache(result);

    return result;
  })();

  inFlight.set(key, promise);

  try {
    const result = await promise;
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unknown error during reverse generation." }, { status: 500 });
  } finally {
    inFlight.delete(key);
  }
}
