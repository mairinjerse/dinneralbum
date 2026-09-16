"use client";

import { useEffect, useState } from "react";

const STATUS_MESSAGES = [
  "Reading the sleeve notes…",
  "Cueing up the tracklist…",
  "Setting the table…",
  "Picking a wine…",
];

interface GeneratingScreenProps {
  title: string;
  artist: string;
}

export default function GeneratingScreen({ title, artist }: GeneratingScreenProps) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cream-border bg-paper p-8 sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-br-full bg-terracotta/80"
        />

        <div className="relative flex flex-col items-center gap-8 py-8 text-center">
          <div className="relative h-28 w-28">
            <div className="absolute inset-0 animate-spin-slow rounded-full border-[10px] border-mustard/25 border-t-terracotta" />
            <div className="absolute inset-[14px] rounded-full bg-ink" />
            <div className="absolute inset-[14px] flex items-center justify-center rounded-full">
              <div className="h-2 w-2 rounded-full bg-cream" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="font-display text-2xl font-bold text-ink">
              {title}
            </p>
            {artist && <p className="text-ink-soft">{artist}</p>}
          </div>

          <p
            key={statusIndex}
            className="animate-fade-in text-sm font-medium tracking-wide text-ink-soft"
          >
            {STATUS_MESSAGES[statusIndex]}
          </p>

          <div className="flex w-full max-w-sm flex-col gap-3 pt-2">
            {[100, 85, 92, 70].map((width, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded-full bg-ink/10"
                style={{ width: `${width}%`, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
