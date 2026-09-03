import type { PackingItemSeed } from "./item-matcher";

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\s・/／]+/g, "")
    .toLocaleLowerCase("ja");
}

export function removeDuplicatePackingItems(items: PackingItemSeed[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const identity = item.key ? `key:${item.key}` : `name:${normalize(item.name)}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}
