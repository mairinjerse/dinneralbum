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

export interface Album {
  title: string;
  artist: string;
  year: string;
  tracks: string[];
}

export interface AlbumCandidate {
  id: string;
  title: string;
  artist: string;
  year: string;
}

export class MusicBrainzNotFoundError extends Error {}

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

function releaseYear(release: MusicBrainzRelease): string {
  return (
    release.date?.slice(0, 4) ||
    release["release-group"]?.["first-release-date"]?.slice(0, 4) ||
    "unknown"
  );
}

export async function searchAlbums(
  query: string,
  limit = 8,
): Promise<AlbumCandidate[]> {
  const lucene = `release:"${escapeLuceneValue(query)}"`;
  const searchUrl = `${MUSICBRAINZ_BASE}/release/?query=${encodeURIComponent(lucene)}&fmt=json&limit=${limit}`;

  const res = await fetchMusicBrainz(searchUrl);
  if (!res.ok) {
    throw new Error(`MusicBrainz search failed: ${res.status}`);
  }
  const data: MusicBrainzSearchResponse = await res.json();

  const seen = new Set<string>();
  const candidates: AlbumCandidate[] = [];
  for (const release of data.releases ?? []) {
    const artist = release["artist-credit"]?.[0]?.name;
    if (!artist) continue;
    const key = `${release.title.toLowerCase()}|${artist.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      id: release.id,
      title: release.title,
      artist,
      year: releaseYear(release),
    });
  }
  return candidates;
}

export async function findAlbum(title: string, artist: string): Promise<Album> {
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

  return {
    title: release.title,
    artist: release["artist-credit"]?.[0]?.name ?? artist,
    year: releaseYear(release),
    tracks,
  };
}
