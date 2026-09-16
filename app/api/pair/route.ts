import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";

const MUSICBRAINZ_USER_AGENT =
  "DinnerAlbum/0.1.0 (https://github.com/mairinjerse/dinneralbum)";
const MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2";

interface MusicBrainzArtistCredit {
  name: string;
}

interface MusicBrainzTrack {
  title: string;
}

interface MusicBrainzMedium {
  tracks?: MusicBrainzTrack[];
}

interface MusicBrainzReleaseGroup {
  "first-release-date"?: string;
}

interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  "artist-credit"?: MusicBrainzArtistCredit[];
  media?: MusicBrainzMedium[];
  "release-group"?: MusicBrainzReleaseGroup;
}

interface MusicBrainzSearchResponse {
  releases?: MusicBrainzRelease[];
}

interface Album {
  title: string;
  artist: string;
  year: string;
  tracks: string[];
}

class MusicBrainzNotFoundError extends Error {}

function escapeLuceneValue(value: string) {
  return value.replace(/"/g, '\\"');
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRY_BACKOFF_MS = [400, 900];

async function fetchMusicBrainz(url: string): Promise<Response> {
  const maxAttempts = RETRY_BACKOFF_MS.length + 1;
  let res: Response;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    res = await fetch(url, { headers: { "User-Agent": MUSICBRAINZ_USER_AGENT } });
    if (res.status !== 503 || attempt === maxAttempts) {
      return res;
    }
    await sleep(RETRY_BACKOFF_MS[attempt - 1]);
  }
  return res!;
}

async function findAlbum(title: string, artist: string): Promise<Album> {
  const query = `release:"${escapeLuceneValue(title)}" AND artist:"${escapeLuceneValue(artist)}"`;
  const searchUrl = `${MUSICBRAINZ_BASE}/release/?query=${encodeURIComponent(query)}&fmt=json&limit=1`;

  const searchRes = await fetchMusicBrainz(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`MusicBrainz search failed: ${searchRes.status}`);
  }
  const searchData: MusicBrainzSearchResponse = await searchRes.json();
  const best = searchData.releases?.[0];
  if (!best) {
    throw new MusicBrainzNotFoundError(`No MusicBrainz match for "${title}" by ${artist}`);
  }

  const lookupUrl = `${MUSICBRAINZ_BASE}/release/${best.id}?inc=recordings+artist-credits+release-groups&fmt=json`;
  const lookupRes = await fetchMusicBrainz(lookupUrl);
  if (!lookupRes.ok) {
    throw new Error(`MusicBrainz lookup failed: ${lookupRes.status}`);
  }
  const release: MusicBrainzRelease = await lookupRes.json();

  const tracks = (release.media ?? []).flatMap(
    (medium) => medium.tracks?.map((track) => track.title) ?? [],
  );

  const year =
    release.date?.slice(0, 4) ||
    release["release-group"]?.["first-release-date"]?.slice(0, 4) ||
    "unknown";

  return {
    title: release.title,
    artist: release["artist-credit"]?.[0]?.name ?? artist,
    year,
    tracks,
  };
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set" },
      { status: 500 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title")?.trim() || "Kind of Blue";
  const artist = searchParams.get("artist")?.trim() || "Miles Davis";

  let album: Album;
  try {
    album = await findAlbum(title, artist);
  } catch (err) {
    if (err instanceof MusicBrainzNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MusicBrainz lookup failed" },
      { status: 502 },
    );
  }

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserMessage(album),
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return NextResponse.json({ text });
}
