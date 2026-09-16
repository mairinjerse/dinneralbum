"use client";

import { useState } from "react";
import LandingScreen from "@/components/LandingScreen";
import GeneratingScreen from "@/components/GeneratingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import type { DinnerPlan } from "@/lib/dinnerPlan";
import type { SpotifyAttribution } from "@/lib/spotify";

type Step = "landing" | "generating" | "results";

interface AlbumInfo {
  title: string;
  artist: string;
  year: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [query, setQuery] = useState({ title: "", artist: "" });
  const [error, setError] = useState<string | null>(null);
  const [album, setAlbum] = useState<AlbumInfo | null>(null);
  const [plan, setPlan] = useState<DinnerPlan | null>(null);
  const [spotify, setSpotify] = useState<SpotifyAttribution | null>(null);

  async function handleSubmit(title: string, artist: string) {
    setQuery({ title, artist });
    setError(null);
    setStep("generating");

    try {
      const params = new URLSearchParams({ title, artist });
      const res = await fetch(`/api/pair?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setAlbum(data.album);
      setPlan(data.plan);
      setSpotify(data.spotify ?? null);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("landing");
    }
  }

  function handleReset() {
    setStep("landing");
    setAlbum(null);
    setPlan(null);
    setSpotify(null);
    setError(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      {step === "landing" && (
        <LandingScreen onSubmit={handleSubmit} error={error} />
      )}
      {step === "generating" && (
        <GeneratingScreen title={query.title} artist={query.artist} />
      )}
      {step === "results" && album && plan && (
        <ResultsScreen
          album={album}
          plan={plan}
          spotify={spotify}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
