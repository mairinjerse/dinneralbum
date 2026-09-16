interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

interface SpotifyArtistRef {
  id: string;
  name: string;
}

interface SpotifyAlbumSearchItem {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
  artists: SpotifyArtistRef[];
}

interface SpotifyAlbumSearchResponse {
  albums?: { items: SpotifyAlbumSearchItem[] };
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface SpotifyAttribution {
  album: {
    name: string;
    imageUrl: string | null;
    spotifyUrl: string;
  } | null;
  artist: {
    name: string;
    imageUrl: string | null;
    spotifyUrl: string;
  } | null;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are not configured");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status}`);
  }

  const data: { access_token: string; expires_in: number } = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

function bestImage(images: SpotifyImage[]): string | null {
  if (images.length === 0) return null;
  return [...images].sort((a, b) => b.width - a.width)[0].url;
}

export async function getSpotifyAttribution(
  title: string,
  artist: string,
): Promise<SpotifyAttribution> {
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  const query = `album:${title} artist:${artist}`;
  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`;
  const searchRes = await fetch(searchUrl, { headers });
  if (!searchRes.ok) {
    throw new Error(`Spotify search failed: ${searchRes.status}`);
  }
  const searchData: SpotifyAlbumSearchResponse = await searchRes.json();
  const albumItem = searchData.albums?.items[0];

  if (!albumItem) {
    return { album: null, artist: null };
  }

  const album = {
    name: albumItem.name,
    imageUrl: bestImage(albumItem.images),
    spotifyUrl: albumItem.external_urls.spotify,
  };

  const artistRef = albumItem.artists[0];
  if (!artistRef) {
    return { album, artist: null };
  }

  const artistRes = await fetch(
    `https://api.spotify.com/v1/artists/${artistRef.id}`,
    { headers },
  );
  if (!artistRes.ok) {
    return { album, artist: null };
  }
  const artistData: SpotifyArtist = await artistRes.json();

  return {
    album,
    artist: {
      name: artistData.name,
      imageUrl: bestImage(artistData.images),
      spotifyUrl: artistData.external_urls.spotify,
    },
  };
}
