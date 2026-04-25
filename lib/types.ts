export type RepoRef = {
  owner: string;
  repo: string;
};

export type RepoMetadata = {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  defaultBranch: string;
  htmlUrl: string;
};

export type RepoTreeEntry = {
  path: string;
  type: "blob" | "tree";
};

export type ReverseResult = {
  owner: string;
  repo: string;
  prompt: string;
  sourceUrl: string;
  createdAt: string;
  viewCount?: number;
};

export type LibrarySort = "newest" | "oldest" | "trending";
