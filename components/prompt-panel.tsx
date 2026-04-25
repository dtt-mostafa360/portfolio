"use client";

import { useState } from "react";

type PromptPanelProps = {
  prompt: string;
  repoUrl: string;
};

export function PromptPanel({ prompt, repoUrl }: PromptPanelProps) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Generated Prompt</h2>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{prompt}</p>
      <a href={repoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm">
        View source repository ↗
      </a>
    </section>
  );
}
