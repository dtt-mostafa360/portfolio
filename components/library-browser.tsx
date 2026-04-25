"use client";

import { useEffect, useState } from "react";
import { RepoCard } from "@/components/repo-card";
import type { LibrarySort, ReverseResult } from "@/lib/types";

export function LibraryBrowser() {
  const [items, setItems] = useState<ReverseResult[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<LibrarySort>("newest");

  async function load(reset = false) {
    setLoading(true);
    const nextPage = reset ? 0 : page;

    const response = await fetch(
      `/api/library?page=${nextPage}&q=${encodeURIComponent(search)}&sort=${sort}`,
    );
    const data = (await response.json()) as { items: ReverseResult[]; hasMore: boolean };

    setItems((current) => (reset ? data.items : [...current, ...data.items]));
    setHasMore(data.hasMore);
    setPage(nextPage + 1);
    setLoading(false);
  }

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search owner, repo, or prompt"
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as LibrarySort)}
          className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="trending">Trending</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <RepoCard key={`${item.owner}/${item.repo}/${item.createdAt}`} item={item} />
        ))}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => load(false)}
          disabled={loading}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
