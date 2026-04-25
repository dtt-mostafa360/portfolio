import type { RepoRef } from "@/lib/types";

const OWNER_REPO_PATTERN = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

export function parseRepoInput(input: string): RepoRef | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let candidate = trimmed;

  if (candidate.startsWith("https://github.com/")) {
    const withoutPrefix = candidate.replace("https://github.com/", "");
    const parts = withoutPrefix.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }
    candidate = `${parts[0]}/${parts[1]}`;
  }

  candidate = candidate.replace(/\.git$/i, "");

  if (!OWNER_REPO_PATTERN.test(candidate)) {
    return null;
  }

  const [owner, repo] = candidate.split("/");

  if (
    owner.includes("..") ||
    repo.includes("..") ||
    !SEGMENT_PATTERN.test(owner) ||
    !SEGMENT_PATTERN.test(repo)
  ) {
    return null;
  }

  return { owner, repo };
}

export function assertValidRouteParams(owner: string, repo: string): RepoRef | null {
  return parseRepoInput(`${owner}/${repo}`);
}

export function repoKey(owner: string, repo: string): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
}
