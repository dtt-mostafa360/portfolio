import { NextRequest, NextResponse } from "next/server";
import { getLibraryPage } from "@/lib/cache";
import type { LibrarySort } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "0");
  const q = searchParams.get("q") ?? "";
  const sortParam = searchParams.get("sort") ?? "newest";
  const sort: LibrarySort =
    sortParam === "oldest" || sortParam === "trending" ? sortParam : "newest";

  const safePage = Number.isFinite(page) && page >= 0 ? page : 0;

  const data = await getLibraryPage(safePage, 24, q, sort);

  return NextResponse.json(data);
}
