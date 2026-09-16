"use client";

interface SpotifyCardProps {
  album: { name: string; imageUrl: string | null; spotifyUrl: string } | null;
  artist: { name: string; imageUrl: string | null; spotifyUrl: string } | null;
}

export default function SpotifyCard({ album, artist }: SpotifyCardProps) {
  if (!album && !artist) return null;

  const playUrl = album?.spotifyUrl ?? artist?.spotifyUrl;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-[#121212] p-4">
      <div className="flex items-center gap-3">
        {album?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.imageUrl}
            alt={`${album.name} cover art`}
            className="h-16 w-16 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[#282828] text-2xl">
            🎵
          </div>
        )}
        {artist?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.imageUrl}
            alt={artist.name}
            className="-ml-6 h-12 w-12 shrink-0 rounded-full border-2 border-[#121212] object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {artist && (
          <p className="truncate text-sm font-medium text-white">{artist.name}</p>
        )}
        {album && (
          <p className="truncate text-xs text-white/60">{album.name}</p>
        )}
      </div>

      {playUrl && (
        <a
          href={playUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-xs font-bold text-black transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play on Spotify
        </a>
      )}
    </div>
  );
}
