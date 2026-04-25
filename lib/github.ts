import { env } from "@/lib/env";
import type { RepoMetadata, RepoTreeEntry } from "@/lib/types";

class GitHubHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubHttpError";
  }
}

const GH_API = "https://api.github.com";

async function githubFetch<T>(path: string): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "GitReverse/1.0",
  };

  if (env.githubToken) {
    headers.Authorization = `Bearer ${env.githubToken}`;
  }

  const response = await fetch(`${GH_API}${path}`, {
    headers,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new GitHubHttpError(`GitHub API error for ${path}`, response.status);
  }

  return (await response.json()) as T;
}

export async function fetchRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
  const repoData = await githubFetch<{
    full_name: string;
    description: string | null;
    stargazers_count: number;
    language: string | null;
    topics?: string[];
    default_branch: string;
    html_url: string;
    owner: { login: string };
    name: string;
  }>(`/repos/${owner}/${repo}`);

  return {
    owner: repoData.owner.login,
    repo: repoData.name,
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    language: repoData.language,
    topics: repoData.topics ?? [],
    defaultBranch: repoData.default_branch,
    htmlUrl: repoData.html_url,
  };
}

export async function fetchRepoTree(owner: string, repo: string, branch: string): Promise<RepoTreeEntry[]> {
  const treeData = await githubFetch<{ tree: { path: string; type: "blob" | "tree" }[] }>(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );

  return treeData.tree.filter((entry) => entry.path.split("/").length <= 2);
}

export async function fetchRepoReadme(owner: string, repo: string, branch: string): Promise<string> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/README.md`,
    {
      headers: env.githubToken ? { Authorization: `Bearer ${env.githubToken}` } : undefined,
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    return "";
  }

  return await response.text();
}

export async function fetchRepoArtifacts(owner: string, repo: string) {
  const metadata = await fetchRepoMetadata(owner, repo);

  let effectiveBranch = metadata.defaultBranch;
  let tree: RepoTreeEntry[];
  let readme: string;

  try {
    tree = await fetchRepoTree(owner, repo, effectiveBranch);
    readme = await fetchRepoReadme(owner, repo, effectiveBranch);
  } catch (error) {
    if (error instanceof GitHubHttpError && error.status === 404 && effectiveBranch === "main") {
      effectiveBranch = "master";
      tree = await fetchRepoTree(owner, repo, effectiveBranch);
      readme = await fetchRepoReadme(owner, repo, effectiveBranch);
    } else {
      throw error;
    }
  }

  return {
    metadata: {
      ...metadata,
      defaultBranch: effectiveBranch,
    },
    tree,
    readme,
  };
}

export function classifyGithubError(error: unknown): { status: number; message: string } {
  if (error instanceof GitHubHttpError) {
    if (error.status === 404) {
      return { status: 404, message: "Repository not found." };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        status: 403,
        message: "GitHub authentication failed or API rate limit exceeded.",
      };
    }
  }

  return {
    status: 500,
    message: "Failed to fetch repository data from GitHub.",
  };
}
