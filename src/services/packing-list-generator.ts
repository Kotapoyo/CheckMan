import packingItems from "@/data/packing-items.json";
import type { AgeGroup, Member, PackItem, Season, TravelType, TripPurpose } from "@/lib/trip-types";
import { removeDuplicatePackingItems } from "@/utils/duplicate-remover";
import {
  matchDestinationSeeds,
  matchDurationSeeds,
  readKeyedSeeds,
  readSeeds,
  type PackingItemSeed,
} from "@/utils/item-matcher";

export interface PackingListGenerationParams {
  destination: string;
  travelType: TravelType;
  nights: number;
  season: Season;
  transport: string;
  purpose: TripPurpose;
  lodging: string;
  activities: string[];
  members: Member[];
}

interface PackingItemsMaster {
  common?: unknown;
  travelType?: unknown;
  season?: unknown;
  transportation?: unknown;
  purpose?: unknown;
  activities?: unknown;
  destinations?: unknown;
  ageGroups?: unknown;
  lodging?: unknown;
  duration?: unknown;
}

let sequence = 0;
function createItemId() {
  sequence += 1;
  return `item_${Date.now().toString(36)}_${sequence}_${Math.random().toString(36).slice(2, 7)}`;
}

function clothingQuantity(key: string | undefined, nights: number) {
  if (key === "tops" || key === "underwear") return Math.max(1, nights + 1);
  if (key === "bottoms") return Math.max(1, Math.ceil((nights + 1) / 2));
  return null;
}

function toPackItem(
  seed: PackingItemSeed,
  params: PackingListGenerationParams,
  self: Member | undefined,
  child: Member | undefined,
): PackItem {
  const quantity = clothingQuantity(seed.key, params.nights);
  return {
    id: createItemId(),
    name: seed.name,
    emoji: seed.emoji,
    priority: seed.priority,
    status: "not_started",
    assigneeId: seed.assignee === "child" ? (child?.id ?? self?.id ?? null) : (self?.id ?? null),
    bag: seed.bag,
    reason: seed.reason,
    ...(quantity === null ? {} : { quantity }),
    updatedAt: Date.now(),
  };
}

export function generatePackingList(params: PackingListGenerationParams): PackItem[] {
  const master = packingItems as PackingItemsMaster;
  const seeds: PackingItemSeed[] = [
    ...readSeeds(master.common),
    ...readKeyedSeeds(master.travelType, params.travelType),
    ...readKeyedSeeds(master.season, params.season),
    ...readKeyedSeeds(master.transportation, params.transport),
    ...readKeyedSeeds(master.purpose, params.purpose),
    ...readKeyedSeeds(master.lodging, params.lodging),
    ...matchDestinationSeeds(master.destinations, params.destination),
    ...matchDurationSeeds(master.duration, params.nights),
  ];

  for (const activity of params.activities) {
    seeds.push(...readKeyedSeeds(master.activities, activity));
  }

  const ageGroups = new Set(params.members.map((member) => member.ageGroup));
  for (const ageGroup of ageGroups) {
    if (ageGroup !== "adult" && ageGroup !== "teen") {
      seeds.push(...readKeyedSeeds(master.ageGroups, ageGroup satisfies AgeGroup));
    }
  }

  const uniqueSeeds = removeDuplicatePackingItems(seeds);
  if (uniqueSeeds.length === 0) {
    throw new Error("持ち物マスタから有効な項目を取得できませんでした。");
  }

  const self = params.members.find((member) => member.kind === "self") ?? params.members[0];
  const child = params.members.find(
    (member) => member.ageGroup !== "adult" && member.ageGroup !== "teen",
  );

  return uniqueSeeds.map((seed) => toPackItem(seed, params, self, child));
}
