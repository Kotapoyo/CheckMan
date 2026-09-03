export type TravelType = "domestic" | "overseas";
export type MemberKind = "self" | "adult" | "child";
export type AgeGroup = "adult" | "teen" | "child" | "toddler" | "baby";
export type Season = "spring" | "summer" | "autumn" | "winter";

export type Priority = "high" | "mid" | "low";
export type ItemStatus = "not_started" | "buy" | "preparing" | "packed" | "unneeded";
export type BagKind = "carryon" | "checked" | "kidsbag" | "wear" | "undecided";

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: "高",
  mid: "中",
  low: "低",
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  not_started: "未着手",
  buy: "買う",
  preparing: "準備中",
  packed: "バッグに入れた",
  unneeded: "不要",
};

export const BAG_LABEL: Record<BagKind, string> = {
  carryon: "機内持込",
  checked: "預け荷物",
  kidsbag: "子どものバッグ",
  wear: "身につける",
  undecided: "未定",
};

export const AGE_LABEL: Record<AgeGroup, string> = {
  adult: "大人",
  teen: "中高生",
  child: "小学生",
  toddler: "幼児",
  baby: "乳児",
};

export const SEASON_LABEL: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

export const TRIP_PURPOSES = [
  "観光",
  "帰省",
  "仕事・出張",
  "アウトドア",
  "イベント・テーマパーク",
  "記念旅行",
] as const;

export type TripPurpose = (typeof TRIP_PURPOSES)[number];

export interface Member {
  id: string;
  name: string;
  kind: MemberKind;
  ageGroup: AgeGroup;
}

export interface PackItem {
  id: string;
  name: string;
  emoji: string;
  priority: Priority;
  status: ItemStatus;
  assigneeId: string | null;
  bag: BagKind;
  reason: string;
  memo?: string;
  quantity?: number;
  purchased?: boolean;
  price?: number | null;
  updatedAt: number;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  travelType: TravelType;
  startDate: string;
  endDate: string;
  members: Member[];
  lodging: string;
  transport: string;
  activities: string[];
  season?: Season;
  purpose?: TripPurpose;
  items: PackItem[];
  completedMilestones?: number[];
  createdAt: number;
}

export const ACTIVITIES = [
  "海・プール",
  "ハイキング",
  "観光・街歩き",
  "温泉",
  "スキー・雪",
  "仕事・出張",
  "写真撮影",
  "レストラン・会食",
];

export const LODGINGS = ["未定", "ホテル", "旅館", "民泊・貸別荘", "実家・親戚宅", "キャンプ"];
export const TRANSPORTS = ["未定", "飛行機", "新幹線・電車", "車", "バス", "船"];

export function inferSeason(date: string): Season {
  const month = new Date(`${date}T00:00:00`).getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function daysBetween(start: string, end: string) {
  const s = new Date(start + "T00:00:00").getTime();
  const e = new Date(end + "T00:00:00").getTime();
  return Math.max(0, Math.round((e - s) / 86400000));
}

export function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + "T00:00:00").getTime();
  return Math.round((d - today.getTime()) / 86400000);
}

export function formatRange(start: string, end: string) {
  const w = ["日", "月", "火", "水", "木", "金", "土"];
  const f = (v: string) => {
    const d = new Date(v + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}（${w[d.getDay()]}）`;
  };
  const nights = daysBetween(start, end);
  return `${f(start)} – ${f(end)} ・ ${nights}泊${nights + 1}日`;
}
