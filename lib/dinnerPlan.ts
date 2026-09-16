export interface MenuItem {
  label: "First" | "Main" | "Side" | "Last";
  dish: string;
  description: string;
}

export interface RunningOrderBeat {
  track: string;
  action: string;
}

export interface DinnerPlan {
  anchor: string;
  menu: MenuItem[];
  drinkOpening: string;
  drinkThroughDinner: string;
  drinkNote: string;
  runningOrder: RunningOrderBeat[];
}

export const DINNER_PLAN_TOOL = {
  name: "dinner_plan",
  description: "The dinner party plan for this album.",
  input_schema: {
    type: "object" as const,
    properties: {
      anchor: {
        type: "string",
        description:
          "Three or four sentences: what the record is, when/where it was made if known and worth knowing, what it sounds and feels like, ending with what kind of evening it suggests.",
      },
      menu: {
        type: "array",
        minItems: 3,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            label: { type: "string", enum: ["First", "Main", "Side", "Last"] },
            dish: { type: "string", description: "The dish name, on its own." },
            description: {
              type: "string",
              description:
                "One line describing the food itself — texture, temperature, how it's served.",
            },
          },
          required: ["label", "dish", "description"],
        },
      },
      drink: {
        type: "object",
        properties: {
          opening: {
            type: "string",
            description: "Opening cocktail, with real proportions.",
          },
          throughDinner: {
            type: "string",
            description: "What to drink through the meal.",
          },
          note: {
            type: "string",
            description: "One line on why the pairing works, in cooking terms.",
          },
        },
        required: ["opening", "throughDinner", "note"],
      },
      runningOrder: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            track: { type: "string", description: "A real track title from the tracklist." },
            action: {
              type: "string",
              description: "What the host is doing at that point — pouring, resting, plating, clearing.",
            },
          },
          required: ["track", "action"],
        },
      },
    },
    required: ["anchor", "menu", "drink", "runningOrder"],
  },
};
