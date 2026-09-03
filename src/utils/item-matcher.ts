import type { BagKind, Priority } from "@/lib/trip-types";

export interface PackingItemSeed {
  key?: string;
  name: string;
  emoji: string;
  priority: Priority;
  bag: BagKind;
  reason: string;
  assignee?: "child";
}

const PRIORITIES = new Set<Priority>(["high", "mid", "low"]);
const BAGS = new Set<BagKind>(["carryon", "checked", "kidsbag", "wear", "undecided"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readSeeds(value: unknown): PackingItemSeed[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate) => {
    if (!isRecord(candidate)) return [];
    const { key, name, emoji, priority, bag, reason, assignee } = candidate;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof emoji !== "string" ||
      typeof priority !== "string" ||
      !PRIORITIES.has(priority as Priority) ||
      typeof bag !== "string" ||
      !BAGS.has(bag as BagKind) ||
      typeof reason !== "string"
    ) {
      return [];
    }

    return [
      {
        ...(typeof key === "string" && key ? { key } : {}),
        name: name.trim(),
        emoji,
        priority: priority as Priority,
        bag: bag as BagKind,
        reason,
        ...(assignee === "child" ? { assignee } : {}),
      },
    ];
  });
}

export function readKeyedSeeds(section: unknown, key: string): PackingItemSeed[] {
  if (!isRecord(section)) return [];
  return readSeeds(section[key]);
}

export function matchDestinationSeeds(section: unknown, destination: string): PackingItemSeed[] {
  if (!Array.isArray(section)) return [];
  const normalizedDestination = destination.trim().toLocaleLowerCase("ja");
  if (!normalizedDestination) return [];

  return section.flatMap((rule) => {
    if (!isRecord(rule) || !Array.isArray(rule["keywords"])) return [];
    const matches = rule["keywords"].some(
      (keyword) =>
        typeof keyword === "string" &&
        normalizedDestination.includes(keyword.toLocaleLowerCase("ja")),
    );
    return matches ? readSeeds(rule["items"]) : [];
  });
}

export function matchDurationSeeds(section: unknown, nights: number): PackingItemSeed[] {
  if (!Array.isArray(section)) return [];

  return section.flatMap((rule) => {
    if (!isRecord(rule) || typeof rule["minNights"] !== "number") return [];
    return nights >= rule["minNights"] ? readSeeds(rule["items"]) : [];
  });
}
