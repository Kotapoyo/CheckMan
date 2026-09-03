import type { AgeGroup, BagKind, Member, PackItem, Priority, TravelType } from "./trip-types";
import {
  generatePackingList,
  type PackingListGenerationParams,
} from "@/services/packing-list-generator";

const OVERSEAS_HINTS = [
  "ハワイ",
  "グアム",
  "台湾",
  "韓国",
  "ソウル",
  "台北",
  "バンコク",
  "タイ",
  "シンガポール",
  "パリ",
  "フランス",
  "イタリア",
  "ローマ",
  "ロンドン",
  "イギリス",
  "ドイツ",
  "スペイン",
  "アメリカ",
  "ニューヨーク",
  "ロサンゼルス",
  "カナダ",
  "オーストラリア",
  "ベトナム",
  "ハノイ",
  "バリ",
  "セブ",
  "中国",
  "上海",
  "香港",
  "ドバイ",
  "スイス",
  "海外",
];

export function detectTravelType(destination: string): TravelType {
  const d = destination.trim();
  if (!d) return "domestic";
  return OVERSEAS_HINTS.some((h) => d.includes(h)) ? "overseas" : "domestic";
}

let seq = 0;
export function uid(prefix = "id") {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}_${Math.random().toString(36).slice(2, 7)}`;
}

interface Seed {
  name: string;
  emoji: string;
  priority: Priority;
  bag: BagKind;
  reason: string;
}

const BASE: Seed[] = [
  {
    name: "財布",
    emoji: "👛",
    priority: "high",
    bag: "wear",
    reason: "現地での支払いに必須です。",
  },
  {
    name: "スマートフォン",
    emoji: "📱",
    priority: "high",
    bag: "wear",
    reason: "連絡・地図・チケット表示に使います。",
  },
  {
    name: "充電器・ケーブル",
    emoji: "🔌",
    priority: "high",
    bag: "carryon",
    reason: "移動中の電池切れを防ぎます。",
  },
  {
    name: "モバイルバッテリー",
    emoji: "🔋",
    priority: "mid",
    bag: "carryon",
    reason: "預け荷物に入れられないため機内持込にします。",
  },
  {
    name: "常備薬",
    emoji: "💊",
    priority: "high",
    bag: "carryon",
    reason: "現地で同じ薬が手に入るとは限りません。",
  },
  {
    name: "健康保険証・身分証",
    emoji: "🪪",
    priority: "high",
    bag: "carryon",
    reason: "急な受診や本人確認に必要です。",
  },
  {
    name: "歯ブラシ・洗面用具",
    emoji: "🪥",
    priority: "mid",
    bag: "checked",
    reason: "宿の備品がない場合に備えます。",
  },
  {
    name: "着替え（上）",
    emoji: "👕",
    priority: "mid",
    bag: "checked",
    reason: "日数分の衣類を用意します。",
  },
  {
    name: "着替え（下）",
    emoji: "👖",
    priority: "mid",
    bag: "checked",
    reason: "日数分の衣類を用意します。",
  },
  {
    name: "下着・靴下",
    emoji: "🧦",
    priority: "mid",
    bag: "checked",
    reason: "日数分の衣類を用意します。",
  },
  {
    name: "エコバッグ",
    emoji: "🛍️",
    priority: "low",
    bag: "checked",
    reason: "お土産や洗濯物の持ち帰りに使えます。",
  },
  {
    name: "常用のスキンケア",
    emoji: "🧴",
    priority: "low",
    bag: "checked",
    reason: "普段と同じものが安心です。",
  },
];

const OVERSEAS: Seed[] = [
  {
    name: "パスポート",
    emoji: "🛂",
    priority: "high",
    bag: "carryon",
    reason: "出入国に必須です。残存有効期間も確認しましょう。",
  },
  {
    name: "航空券・eチケット控え",
    emoji: "🎫",
    priority: "high",
    bag: "carryon",
    reason: "搭乗手続きで提示します。",
  },
  {
    name: "海外旅行保険の控え",
    emoji: "📄",
    priority: "high",
    bag: "carryon",
    reason: "現地での医療費に備えます。",
  },
  {
    name: "変換プラグ",
    emoji: "🔌",
    priority: "high",
    bag: "carryon",
    reason: "渡航先のコンセント形状が異なります。",
  },
  {
    name: "現地通貨・クレジットカード",
    emoji: "💳",
    priority: "high",
    bag: "wear",
    reason: "現金が必要な場面があります。",
  },
  {
    name: "海外eSIM・Wi-Fiルーター",
    emoji: "📶",
    priority: "mid",
    bag: "carryon",
    reason: "現地での通信手段を確保します。",
  },
];

const FLIGHT: Seed[] = [
  {
    name: "航空券・搭乗券",
    emoji: "🎫",
    priority: "high",
    bag: "carryon",
    reason: "搭乗手続きで提示します。",
  },
  {
    name: "機内用ネックピロー",
    emoji: "🛌",
    priority: "low",
    bag: "carryon",
    reason: "長時間の移動を楽にします。",
  },
];

const KIDS: Seed[] = [
  {
    name: "子ども用おやつ",
    emoji: "🍪",
    priority: "low",
    bag: "carryon",
    reason: "移動中のぐずり対策になります。",
  },
  {
    name: "子どもの着替え（予備）",
    emoji: "👶",
    priority: "mid",
    bag: "kidsbag",
    reason: "汚れたときの替えが必要です。",
  },
  {
    name: "お気に入りのおもちゃ",
    emoji: "🧸",
    priority: "low",
    bag: "kidsbag",
    reason: "待ち時間を過ごしやすくします。",
  },
  {
    name: "母子手帳・子どもの保険証",
    emoji: "📘",
    priority: "high",
    bag: "carryon",
    reason: "急な受診時に必要です。",
  },
];

const BABY: Seed[] = [
  {
    name: "おむつ・おしりふき",
    emoji: "🧷",
    priority: "high",
    bag: "carryon",
    reason: "移動中に必ず使います。",
  },
  {
    name: "ミルク・離乳食",
    emoji: "🍼",
    priority: "high",
    bag: "carryon",
    reason: "現地で同じものが買えない場合があります。",
  },
];

const ACTIVITY_MAP: Record<string, Seed[]> = {
  "海・プール": [
    {
      name: "水着",
      emoji: "🩱",
      priority: "mid",
      bag: "checked",
      reason: "海・プールで使います。",
    },
    {
      name: "日焼け止め",
      emoji: "🧴",
      priority: "mid",
      bag: "checked",
      reason: "屋外で長時間過ごすため必要です。",
    },
    {
      name: "ビーチサンダル",
      emoji: "🩴",
      priority: "low",
      bag: "checked",
      reason: "濡れた場所で歩きやすくなります。",
    },
    {
      name: "帽子",
      emoji: "👒",
      priority: "low",
      bag: "checked",
      reason: "日差し対策になります。",
    },
  ],
  ハイキング: [
    {
      name: "歩きやすい靴",
      emoji: "🥾",
      priority: "mid",
      bag: "wear",
      reason: "足元の安全に関わります。",
    },
    {
      name: "レインウェア",
      emoji: "🧥",
      priority: "mid",
      bag: "checked",
      reason: "山の天候は変わりやすいです。",
    },
    {
      name: "飲料水",
      emoji: "🚰",
      priority: "mid",
      bag: "carryon",
      reason: "行動中の水分補給に必要です。",
    },
  ],
  "観光・街歩き": [
    {
      name: "折りたたみ傘",
      emoji: "☂️",
      priority: "low",
      bag: "carryon",
      reason: "急な雨に備えます。",
    },
    {
      name: "小さめのバッグ",
      emoji: "🎒",
      priority: "low",
      bag: "checked",
      reason: "街歩き用に身軽になれます。",
    },
  ],
  温泉: [
    {
      name: "フェイスタオル",
      emoji: "🧻",
      priority: "low",
      bag: "checked",
      reason: "外湯めぐりで役立ちます。",
    },
    {
      name: "ヘアゴム・スキンケア",
      emoji: "💆",
      priority: "low",
      bag: "checked",
      reason: "入浴後のケアに使います。",
    },
  ],
  "スキー・雪": [
    {
      name: "防寒着・手袋",
      emoji: "🧤",
      priority: "high",
      bag: "checked",
      reason: "低温下では安全に直結します。",
    },
    {
      name: "ゴーグル",
      emoji: "🥽",
      priority: "mid",
      bag: "checked",
      reason: "雪面の照り返し対策です。",
    },
    {
      name: "厚手の靴下",
      emoji: "🧦",
      priority: "mid",
      bag: "checked",
      reason: "冷え対策になります。",
    },
  ],
  "仕事・出張": [
    {
      name: "ノートPC・充電器",
      emoji: "💻",
      priority: "high",
      bag: "carryon",
      reason: "業務に必須です。",
    },
    {
      name: "名刺",
      emoji: "🗂️",
      priority: "mid",
      bag: "carryon",
      reason: "打ち合わせで使います。",
    },
    {
      name: "ジャケット・革靴",
      emoji: "👔",
      priority: "mid",
      bag: "checked",
      reason: "訪問先の服装に合わせます。",
    },
  ],
  写真撮影: [
    {
      name: "カメラ・予備バッテリー",
      emoji: "📷",
      priority: "mid",
      bag: "carryon",
      reason: "撮影中の電池切れを防ぎます。",
    },
    {
      name: "SDカード",
      emoji: "💾",
      priority: "low",
      bag: "carryon",
      reason: "容量不足を防ぎます。",
    },
  ],
  "レストラン・会食": [
    {
      name: "きれいめの服",
      emoji: "👗",
      priority: "low",
      bag: "checked",
      reason: "ドレスコードに備えます。",
    },
  ],
};

function generateFallbackItems(params: {
  travelType: TravelType;
  nights: number;
  members: Member[];
  transport: string;
  activities: string[];
}): PackItem[] {
  const { travelType, nights, members, transport, activities } = params;
  const seeds: Seed[] = [...BASE];

  if (travelType === "overseas") seeds.push(...OVERSEAS);
  if (transport === "飛行機" && travelType === "domestic") seeds.push(...FLIGHT);

  const ages = members.map((m) => m.ageGroup as AgeGroup);
  if (ages.some((a) => a === "child" || a === "toddler" || a === "baby")) seeds.push(...KIDS);
  if (ages.some((a) => a === "baby")) seeds.push(...BABY);

  for (const a of activities) seeds.push(...(ACTIVITY_MAP[a] ?? []));

  if (nights >= 3) {
    seeds.push({
      name: "洗濯用洗剤・圧縮袋",
      emoji: "🧼",
      priority: "low",
      bag: "checked",
      reason: "3泊以上では衣類を減らせます。",
    });
  }

  const seen = new Set<string>();
  const kidsMember = members.find((m) => m.kind === "child");
  const self = members.find((m) => m.kind === "self") ?? members[0];

  return seeds
    .filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true)))
    .map((s) => ({
      id: uid("item"),
      name: s.name,
      emoji: s.emoji,
      priority: s.priority,
      status: "not_started" as const,
      assigneeId:
        (s.bag === "kidsbag" || s.name.includes("子ども")) && kidsMember
          ? kidsMember.id
          : (self?.id ?? null),
      bag: s.bag,
      reason: s.reason,
      updatedAt: Date.now(),
    }));
}

export function generateItems(params: PackingListGenerationParams): PackItem[] {
  try {
    return generatePackingList(params);
  } catch (error) {
    console.warn("条件別の持ち物生成に失敗したため、基本リストを使用します。", error);
    return generateFallbackItems(params);
  }
}
