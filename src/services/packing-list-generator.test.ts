import { describe, expect, it } from "vitest";
import type { Member } from "@/lib/trip-types";
import { generatePackingList } from "./packing-list-generator";

const self: Member = {
  id: "member-self",
  name: "自分",
  kind: "self",
  ageGroup: "adult",
};

const generate = (overrides: Partial<Parameters<typeof generatePackingList>[0]> = {}) =>
  generatePackingList({
    destination: "沖縄",
    travelType: "domestic",
    nights: 3,
    season: "summer",
    transport: "飛行機",
    purpose: "観光",
    lodging: "ホテル",
    activities: ["海・プール"],
    members: [self],
    ...overrides,
  });

describe("generatePackingList", () => {
  it("旅行条件に合う候補を生成し、複数条件に一致した項目を重複させない", () => {
    const items = generate();
    const names = items.map((item) => item.name);

    expect(names).toEqual(
      expect.arrayContaining([
        "財布",
        "日焼け止め",
        "水着",
        "航空券・搭乗券",
        "洗濯用洗剤・圧縮袋",
      ]),
    );
    expect(names.filter((name) => name === "日焼け止め")).toHaveLength(1);
  });

  it("旅行日数に応じて衣類の数量を設定する", () => {
    const items = generate();

    expect(items.find((item) => item.name === "着替え（上）")?.quantity).toBe(4);
    expect(items.find((item) => item.name === "着替え（下）")?.quantity).toBe(2);
    expect(items.find((item) => item.name === "下着・靴下")?.quantity).toBe(4);
  });

  it("子ども向け候補を最初の子どもに割り当てる", () => {
    const child: Member = {
      id: "member-child",
      name: "子ども",
      kind: "child",
      ageGroup: "child",
    };
    const items = generate({ members: [self, child] });

    expect(items.find((item) => item.name === "子ども用おやつ")?.assigneeId).toBe(child.id);
    expect(items.find((item) => item.name === "財布")?.assigneeId).toBe(self.id);
  });

  it("海外旅行に必要な候補を追加する", () => {
    const items = generate({ destination: "ハワイ", travelType: "overseas" });

    expect(items.map((item) => item.name)).toEqual(
      expect.arrayContaining(["パスポート", "海外旅行保険の控え", "変換プラグ"]),
    );
  });
});
