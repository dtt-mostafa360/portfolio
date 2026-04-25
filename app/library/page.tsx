import { LibraryBrowser } from "@/components/library-browser";

export default function LibraryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-white">Prompt Library</h1>
      <p className="text-sm text-zinc-300">Explore cached reverse prompts across analyzed repositories.</p>
      <LibraryBrowser />
    </div>
  );
}
