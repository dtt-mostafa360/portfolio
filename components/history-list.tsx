"use client";

import { useEffect, useState } from "react";
import { RepoCard } from "@/components/repo-card";
import type { ReverseResult } from "@/lib/types";

const HISTORY_KEY = "gitreverse-history";

export function HistoryList() {
  const [items, setItems] = useState<ReverseResult[]>([]);

  useEffect(() => {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as ReverseResult[];
    setItems(parsed.slice(0, 20));
  }, []);

  if (!items.length) {
    return <p className="text-sm text-zinc-400">No history yet. Generate a prompt to get started.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <RepoCard key={`${item.owner}/${item.repo}/${item.createdAt}`} item={item} />
      ))}
    </div>
  );
}
