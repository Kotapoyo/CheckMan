import { describe, expect, it } from "vitest";
import type { PackingItemSeed } from "./item-matcher";
import { removeDuplicatePackingItems } from "./duplicate-remover";

const seed = (overrides: Partial<PackingItemSeed> = {}): PackingItemSeed => ({
  name: "日焼け止め",
  emoji: "🧴",
  priority: "mid",
  bag: "checked",
  reason: "日差しに備えます。",
  ...overrides,
});

describe("removeDuplicatePackingItems", () => {
  it("同じkeyを持つ候補を1件にまとめる", () => {
    const items = removeDuplicatePackingItems([
      seed({ key: "sunscreen" }),
      seed({ key: "sunscreen", reason: "海辺で使います。" }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.reason).toBe("日差しに備えます。");
  });

  it("keyがない場合は表記を正規化して重複を判定する", () => {
    const items = removeDuplicatePackingItems([
      seed({ name: "充電器・ケーブル" }),
      seed({ name: "充電器 ／ ケーブル" }),
    ]);

    expect(items).toHaveLength(1);
  });
});
