import { NextRequest, NextResponse } from "next/server";
import { searchAlbums } from "@/lib/musicbrainz";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchAlbums(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MusicBrainz search failed" },
      { status: 502 },
    );
  }
}
