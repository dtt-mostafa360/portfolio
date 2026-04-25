import { notFound } from "next/navigation";
import { ReverseWorkspace } from "@/components/reverse-workspace";
import { ViewTracker } from "@/components/view-tracker";
import { getPromptCache } from "@/lib/cache";
import { assertValidRouteParams } from "@/lib/repo";

export default async function RepoPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const parsed = assertValidRouteParams(owner, repo);

  if (!parsed) {
    notFound();
  }

  const cached = await getPromptCache(parsed.owner, parsed.repo);

  return (
    <>
      <ViewTracker repo={`${parsed.owner}/${parsed.repo}`} />
      <ReverseWorkspace
        initialRepo={`${parsed.owner}/${parsed.repo}`}
        initialResult={cached}
        allowAutoload={!cached}
      />
    </>
  );
}
