import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitReverse",
  description: "Reverse engineer synthetic build prompts from GitHub repositories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white">
              GitReverse
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-300">
              <Link href="/library">Library</Link>
              <Link href="/history">History</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
