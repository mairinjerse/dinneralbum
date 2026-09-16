import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";
import { findAlbum, MusicBrainzNotFoundError } from "@/lib/musicbrainz";
import { DINNER_PLAN_TOOL, type DinnerPlan } from "@/lib/dinnerPlan";

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

  let album;
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
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    tools: [DINNER_PLAN_TOOL],
    tool_choice: { type: "tool", name: "dinner_plan" },
    messages: [
      {
        role: "user",
        content: buildUserMessage(album),
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json(
      { error: "Claude did not return a dinner plan" },
      { status: 502 },
    );
  }

  const input = toolUse.input as {
    anchor: string;
    menu: { label: "First" | "Main" | "Side" | "Last"; dish: string; description: string }[];
    drink: { opening: string; throughDinner: string; note: string };
    runningOrder: { track: string; action: string }[];
  };

  const plan: DinnerPlan = {
    anchor: input.anchor,
    menu: input.menu,
    drinkOpening: input.drink.opening,
    drinkThroughDinner: input.drink.throughDinner,
    drinkNote: input.drink.note,
    runningOrder: input.runningOrder,
  };

  return NextResponse.json({
    plan,
    album: { title: album.title, artist: album.artist, year: album.year },
  });
}
