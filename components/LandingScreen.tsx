"use client";

import { useEffect, useRef, useState } from "react";

export interface AlbumCandidate {
  id: string;
  title: string;
  artist: string;
  year: string;
}

interface LandingScreenProps {
  onSubmit: (title: string, artist: string) => void;
  error: string | null;
}

export default function LandingScreen({ onSubmit, error }: LandingScreenProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [suggestions, setSuggestions] = useState<AlbumCandidate[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (title.trim().length < 2) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/albums/search?q=${encodeURIComponent(title.trim())}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        // Stale/aborted request — ignore.
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title]);

  function pickSuggestion(candidate: AlbumCandidate) {
    setTitle(candidate.title);
    setArtist(candidate.artist);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setShowSuggestions(false);
    onSubmit(title.trim(), artist.trim());
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-border bg-surface p-8 sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-20 h-48 w-48 rounded-full bg-accent sm:-left-24 sm:top-24 sm:h-80 sm:w-80 md:h-96 md:w-96"
        />

        <div className="relative flex flex-col gap-10">
          <p className="text-sm font-medium tracking-wide text-ink-soft">
            Album dinner party
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="relative flex flex-col gap-1">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Album name"
                autoFocus
                className="font-display w-full border-b-2 border-ink/20 bg-transparent pb-2 text-4xl font-bold text-ink placeholder:text-ink/30 outline-none focus:border-ink/50 sm:text-5xl"
              />
              {showSuggestions && title.trim().length >= 2 && suggestions.length > 0 && (
                <ul className="absolute top-full z-10 mt-2 w-full overflow-hidden rounded-xl border border-surface-border bg-surface shadow-lg">
                  {suggestions.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(c)}
                        className="flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-accent-soft"
                      >
                        <span className="text-ink">
                          {c.title}{" "}
                          <span className="text-ink-soft">— {c.artist}</span>
                        </span>
                        <span className="shrink-0 text-ink-soft">{c.year}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist (optional — pick a suggestion above, or type your own)"
              className="w-full border-b border-ink/15 bg-transparent pb-2 text-lg text-ink placeholder:text-ink-soft/70 outline-none focus:border-ink/40"
            />

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <span className="h-px flex-1 bg-rule" />
              <button
                type="submit"
                disabled={!title.trim()}
                className="ml-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Set the table
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
