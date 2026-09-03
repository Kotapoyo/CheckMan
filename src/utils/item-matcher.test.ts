import { describe, expect, it } from "vitest";
import { matchDestinationSeeds, matchDurationSeeds, readSeeds } from "./item-matcher";

describe("item matcher", () => {
  it("不正な候補を除外し、有効な候補だけを返す", () => {
    const items = readSeeds([
      {
        key: "passport",
        name: " パスポート ",
        emoji: "🛂",
        priority: "high",
        bag: "carryon",
        reason: "出入国に必要です。",
      },
      { name: "優先度が不正", emoji: "?", priority: "urgent", bag: "carryon", reason: "" },
      null,
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("パスポート");
  });

  it("旅行先を大文字小文字を区別せず部分一致で判定する", () => {
    const section = [
      {
        keywords: ["hawaii", "ハワイ"],
        items: [
          {
            name: "日焼け止め",
            emoji: "🧴",
            priority: "mid",
            bag: "checked",
            reason: "日差しに備えます。",
          },
        ],
      },
    ];

    expect(matchDestinationSeeds(section, "Hawaii Honolulu")).toHaveLength(1);
  });

  it("宿泊数が条件を満たす場合だけ候補を返す", () => {
    const section = [
      {
        minNights: 3,
        items: [
          {
            name: "洗濯用洗剤",
            emoji: "🧼",
            priority: "low",
            bag: "checked",
            reason: "長期旅行に備えます。",
          },
        ],
      },
    ];

    expect(matchDurationSeeds(section, 2)).toHaveLength(0);
    expect(matchDurationSeeds(section, 3)).toHaveLength(1);
  });
});
