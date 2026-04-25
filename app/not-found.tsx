import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8">
      <h1 className="text-2xl font-bold text-white">404 - Not found</h1>
      <p className="mt-2 text-sm text-zinc-300">That repository route is invalid.</p>
      <Link href="/" className="mt-4 inline-block text-sm">
        Return home
      </Link>
    </div>
  );
}
