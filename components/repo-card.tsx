import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { truncate } from "@/lib/utils";
import type { ReverseResult } from "@/lib/types";

export function RepoCard({ item }: { item: ReverseResult }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link href={`/${item.owner}/${item.repo}`} className="font-semibold text-white">
          {item.owner}/{item.repo}
        </Link>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-zinc-400">
          GitHub ↗
        </a>
      </div>
      <p className="mb-3 text-sm text-zinc-300">{truncate(item.prompt, 160)}</p>
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
        <span>{item.viewCount ?? 0} views</span>
      </div>
    </article>
  );
}
