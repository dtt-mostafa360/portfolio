"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PromptPanel } from "@/components/prompt-panel";
import { parseRepoInput } from "@/lib/repo";
import { truncate } from "@/lib/utils";

type ReverseResponse = {
  owner: string;
  repo: string;
  prompt: string;
  sourceUrl: string;
  createdAt: string;
};

const HISTORY_KEY = "gitreverse-history";

function saveHistoryItem(item: ReverseResponse) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as ReverseResponse[];
  const next = [item, ...existing.filter((entry) => !(entry.owner === item.owner && entry.repo === item.repo))]
    .slice(0, 20)
    .map((entry) => ({
      ...entry,
      prompt: truncate(entry.prompt, 160),
    }));

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function ReverseWorkspace({
  initialRepo,
  initialResult,
  allowAutoload,
}: {
  initialRepo?: string;
  initialResult?: ReverseResponse | null;
  allowAutoload?: boolean;
}) {
  const router = useRouter();
  const [repoInput, setRepoInput] = useState(initialRepo ?? "");
  const [manualMode, setManualMode] = useState(false);
  const [focus, setFocus] = useState("");
  const [result, setResult] = useState<ReverseResponse | null>(initialResult ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);

  useMemo(() => {
    if (allowAutoload && initialRepo && !initialResult) {
      void handleGenerate(initialRepo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate(repoValue = repoInput) {
    setError(null);
    setLoading(true);

    const parsed = parseRepoInput(repoValue);
    if (!parsed) {
      setError("Enter a valid GitHub URL or owner/repo format.");
      setLoading(false);
      return;
    }

    const normalized = `${parsed.owner}/${parsed.repo}`;

    try {
      const response = await fetch("/api/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: normalized }),
      });

      const data = (await response.json()) as ReverseResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed.");
      }

      setResult(data);
      saveHistoryItem(data);
      router.push(`/${data.owner}/${data.repo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManual() {
    if (!result && !parseRepoInput(repoInput)) {
      setError("Generate a standard prompt first or enter a valid repo.");
      return;
    }

    setError(null);
    setLoading(true);

    const parsed = parseRepoInput(repoInput || `${result?.owner}/${result?.repo}`);
    if (!parsed) {
      setLoading(false);
      setError("Invalid repository format.");
      return;
    }

    try {
      const response = await fetch("/api/reverse-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: `${parsed.owner}/${parsed.repo}`,
          mode: "custom",
          focus,
        }),
      });

      const data = (await response.json()) as ReverseResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Custom generation failed.");
      }

      setResult(data);
      saveHistoryItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Custom generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeepReverse() {
    const repo = result ? `${result.owner}/${result.repo}` : repoInput;
    const parsed = parseRepoInput(repo);
    if (!parsed) {
      setError("Generate a standard prompt first.");
      return;
    }

    setError(null);
    setDeepLoading(true);

    try {
      const response = await fetch("/api/reverse-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: `${parsed.owner}/${parsed.repo}`, mode: "deep" }),
      });

      const data = (await response.json()) as ReverseResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Deep reverse failed.");
      }

      setResult(data);
      saveHistoryItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deep reverse failed.");
    } finally {
      setDeepLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h1 className="text-3xl font-bold text-white">Reverse-engineer any GitHub repo into a build prompt</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Paste a repository and get a synthetic prompt you can drop into Claude, Cursor, or your coding
          agent.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="https://github.com/owner/repo or owner/repo"
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-indigo-500/40 focus:ring"
          />
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Prompt"}
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={manualMode}
            onChange={(e) => setManualMode(e.target.checked)}
            className="h-4 w-4"
          />
          Manual control
        </label>

        {manualMode ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              rows={4}
              placeholder="Reverse-engineer only the auth module and explain likely architectural tradeoffs."
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-indigo-500/40 focus:ring"
            />
            <button
              type="button"
              onClick={handleManual}
              disabled={loading}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Processing..." : "Run Manual Reverse"}
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </section>

      {!initialRepo ? (
        <section className="grid gap-3 sm:grid-cols-3">
          {["vercel/next.js", "supabase/supabase", "tailwindlabs/tailwindcss"].map((example) => (
            <Link
              key={example}
              href={`/${example}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Try example: {example}
            </Link>
          ))}
        </section>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <PromptPanel prompt={result.prompt} repoUrl={result.sourceUrl} />
          <button
            type="button"
            onClick={handleDeepReverse}
            disabled={deepLoading}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-60"
          >
            {deepLoading ? "Deep reversing..." : "Deep Reverse"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
