import { redirect } from "next/navigation";
import { assertValidRouteParams } from "@/lib/repo";

export default async function TreeRedirectPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; branch: string }>;
}) {
  const { owner, repo } = await params;

  const parsed = assertValidRouteParams(owner, repo);
  if (!parsed) {
    redirect("/");
  }

  redirect(`/${parsed.owner}/${parsed.repo}`);
}
