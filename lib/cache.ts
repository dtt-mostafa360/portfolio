import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";
import type { LibrarySort, ReverseResult } from "@/lib/types";

function logCacheError(context: string, error: unknown) {
  console.error(`[cache:${context}]`, error);
}

export async function getPromptCache(owner: string, repo: string): Promise<ReverseResult | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("prompt_cache")
    .select("owner, repo, prompt, source_url, created_at, view_count")
    .eq("owner", owner)
    .eq("repo", repo)
    .maybeSingle();

  if (error) {
    logCacheError("getPromptCache", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    owner: data.owner,
    repo: data.repo,
    prompt: data.prompt,
    sourceUrl: data.source_url,
    createdAt: data.created_at,
    viewCount: data.view_count ?? 0,
  };
}

export async function setPromptCache(result: ReverseResult): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("prompt_cache").upsert(
    {
      owner: result.owner,
      repo: result.repo,
      prompt: result.prompt,
      source_url: result.sourceUrl,
      created_at: result.createdAt,
    },
    { onConflict: "owner,repo" },
  );

  if (error) {
    logCacheError("setPromptCache", error);
  }
}

export function focusFingerprint(focus: string): string {
  return createHash("md5").update(focus).digest("hex");
}

export async function getCustomPromptCache(
  owner: string,
  repo: string,
  fingerprint: string,
): Promise<ReverseResult | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("custom_prompt_cache")
    .select("owner, repo, prompt, source_url, created_at")
    .eq("owner", owner)
    .eq("repo", repo)
    .eq("focus_fingerprint", fingerprint)
    .maybeSingle();

  if (error) {
    logCacheError("getCustomPromptCache", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    owner: data.owner,
    repo: data.repo,
    prompt: data.prompt,
    sourceUrl: data.source_url,
    createdAt: data.created_at,
  };
}

export async function setCustomPromptCache(
  owner: string,
  repo: string,
  fingerprint: string,
  prompt: string,
  sourceUrl: string,
): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("custom_prompt_cache").upsert(
    {
      owner,
      repo,
      focus_fingerprint: fingerprint,
      prompt,
      source_url: sourceUrl,
    },
    { onConflict: "owner,repo,focus_fingerprint" },
  );

  if (error) {
    logCacheError("setCustomPromptCache", error);
  }
}

export async function getLibraryPage(
  page: number,
  pageSize: number,
  search: string,
  sort: LibrarySort,
): Promise<{ items: ReverseResult[]; hasMore: boolean }> {
  if (!supabase) {
    return { items: [], hasMore: false };
  }

  const from = page * pageSize;
  const to = from + pageSize;

  let query = supabase
    .from("prompt_cache")
    .select("owner, repo, prompt, source_url, created_at, view_count")
    .range(from, to);

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(`owner.ilike.${q},repo.ilike.${q},prompt.ilike.${q}`);
  }

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "trending") {
    query = query.order("view_count", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    logCacheError("getLibraryPage", error);
    return { items: [], hasMore: false };
  }

  const items = (data ?? []).slice(0, pageSize).map((row) => ({
    owner: row.owner,
    repo: row.repo,
    prompt: row.prompt,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
    viewCount: row.view_count ?? 0,
  }));

  return {
    items,
    hasMore: (data?.length ?? 0) > pageSize,
  };
}

export async function incrementViews(owner: string, repo: string, ipHash: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc("increment_views", {
    p_owner: owner,
    p_repo: repo,
    p_ip_hash: ipHash,
  });

  if (error) {
    logCacheError("incrementViews", error);
  }
}
