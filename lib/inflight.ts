import type { ReverseResult } from "@/lib/types";

const reverseInFlight = new Map<string, Promise<ReverseResult>>();
const customInFlight = new Map<string, Promise<ReverseResult>>();

export function getInFlightMap(kind: "reverse" | "custom") {
  return kind === "reverse" ? reverseInFlight : customInFlight;
}
