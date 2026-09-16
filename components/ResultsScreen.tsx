"use client";

import type { DinnerPlan } from "@/lib/dinnerPlan";
import type { SpotifyAttribution } from "@/lib/spotify";
import SpotifyCard from "./SpotifyCard";

interface AlbumInfo {
  title: string;
  artist: string;
  year: string;
}

interface ResultsScreenProps {
  album: AlbumInfo;
  plan: DinnerPlan;
  spotify: SpotifyAttribution | null;
  onReset: () => void;
}

const DOT_COLORS = ["bg-accent", "bg-ink", "bg-accent-soft"];

export default function ResultsScreen({
  album,
  plan,
  spotify,
  onReset,
}: ResultsScreenProps) {
  return (
    <div className="relative flex flex-1 justify-center overflow-hidden p-4 py-8 sm:py-12">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-surface-border bg-surface p-6 sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-2 -top-2 h-24 w-24 rounded-br-[3rem] bg-accent sm:h-32 sm:w-32"
        />

        <div className="relative flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink"
          >
            ← Another album
          </button>
        </div>

        <header className="relative -mt-6 flex flex-col gap-2 pl-16 sm:-mt-8 sm:pl-20">
          <span className="mb-1 inline-flex w-fit items-center rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            Dinner for
          </span>
          <h1 className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
            {album.artist}
          </h1>
          <h2 className="-mt-1 text-lg font-medium leading-tight text-ink-soft sm:text-xl">
            {album.title}
          </h2>
        </header>

        {spotify && (spotify.album || spotify.artist) && (
          <div className="mt-6">
            <SpotifyCard album={spotify.album} artist={spotify.artist} />
          </div>
        )}

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink-soft">
          {plan.anchor}
        </p>

        <hr className="my-8 border-rule" />

        <div className="relative grid gap-x-10 gap-y-8 sm:grid-cols-2">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-4 top-4 -z-10 hidden h-20 w-20 rounded-full bg-accent sm:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-4 bottom-4 -z-10 hidden h-16 w-24 rounded-full bg-ink/90 sm:block"
          />
          {plan.menu.map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
                {item.label}
              </p>
              <p className="font-medium text-ink">{item.dish}</p>
              {item.description && (
                <p className="text-sm text-ink-soft">{item.description}</p>
              )}
            </div>
          ))}
        </div>

        <hr className="my-8 border-rule" />

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
            Drink
          </p>
          {plan.drinkOpening && (
            <p className="text-sm text-ink">
              <span className="font-medium">Opening — </span>
              {plan.drinkOpening}
            </p>
          )}
          {plan.drinkThroughDinner && (
            <p className="text-sm text-ink">
              <span className="font-medium">Through dinner — </span>
              {plan.drinkThroughDinner}
            </p>
          )}
          {plan.drinkNote && (
            <p className="text-sm italic text-ink-soft">{plan.drinkNote}</p>
          )}
        </div>

        <hr className="my-8 border-rule" />

        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
            Running order
          </p>
          <RunningOrderColumns beats={plan.runningOrder} />
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div className="flex gap-1.5">
            {DOT_COLORS.map((color) => (
              <span key={color} className={`h-2.5 w-2.5 rounded-full ${color}`} />
            ))}
          </div>
          <div className="flex gap-5 text-sm font-medium">
            <button
              type="button"
              onClick={() => window.print()}
              className="text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink"
            >
              Print the menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RunningOrderColumns({
  beats,
}: {
  beats: DinnerPlan["runningOrder"];
}) {
  return (
    <div className="flex flex-col">
      {beats.map((beat, index) => (
        <BeatRow key={`${beat.track}-${index}`} beat={beat} />
      ))}
    </div>
  );
}

function BeatRow({ beat }: { beat: DinnerPlan["runningOrder"][number] }) {
  return (
    <div className="flex flex-col gap-1 border-b border-rule py-3 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="shrink-0 text-sm font-medium text-ink sm:w-52">
        {beat.track}
      </span>
      <span className="text-sm text-ink-soft">{beat.action}</span>
    </div>
  );
}
