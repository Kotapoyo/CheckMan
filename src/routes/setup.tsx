import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import {
  ACTIVITIES,
  AGE_LABEL,
  BAG_LABEL,
  LODGINGS,
  PRIORITY_LABEL,
  SEASON_LABEL,
  TRANSPORTS,
  TRIP_PURPOSES,
  daysBetween,
  inferSeason,
  type AgeGroup,
  type Member,
  type PackItem,
  type TripPurpose,
  type TravelType,
} from "@/lib/trip-types";
import { detectTravelType, generateItems, uid } from "@/lib/trip-templates";
import { actions } from "@/lib/trip-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "旅行をつくる｜CheckMan" },
      {
        name: "description",
        content:
          "目的地・日程・同行者を入力すると、旅行に合わせた初期持ち物リストを自動作成します。",
      },
      { property: "og:title", content: "旅行をつくる｜CheckMan" },
      {
        property: "og:description",
        content: "60秒で旅行の持ち物リストを作成。家族の担当分けまで一度に。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Setup,
});

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState("");
  const [travelType, setTravelType] = useState<TravelType | null>(null);
  const [startDate, setStartDate] = useState(todayPlus(14));
  const [endDate, setEndDate] = useState(todayPlus(17));
  const [members, setMembers] = useState<Member[]>([
    { id: uid("m"), name: "自分", kind: "self", ageGroup: "adult" },
  ]);
  const [lodging, setLodging] = useState("未定");
  const [transport, setTransport] = useState("未定");
  const [purpose, setPurpose] = useState<TripPurpose>("観光");
  const [activities, setActivities] = useState<string[]>([]);
  const [draft, setDraft] = useState<PackItem[] | null>(null);

  const type = travelType ?? detectTravelType(destination);
  const nights = daysBetween(startDate, endDate);
  const resolvedSeason = inferSeason(startDate);

  const buildDraft = () =>
    generateItems({
      destination: destination.trim(),
      travelType: type,
      nights,
      season: resolvedSeason,
      transport,
      purpose,
      lodging,
      activities,
      members,
    });

  const canNext = useMemo(() => {
    if (step === 1) return destination.trim().length > 0;
    if (step === 2) return Boolean(startDate && endDate && endDate >= startDate);
    if (step === 3) return members.length > 0;
    return true;
  }, [step, destination, startDate, endDate, members]);

  const goNext = () => {
    if (step === 4) {
      setDraft(buildDraft());
      setStep(5);
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const finish = () => {
    const trip = {
      id: uid("trip"),
      name: `${destination.trim()}・${members.length > 1 ? "みんなの旅行" : "ひとり旅"}`,
      destination: destination.trim(),
      travelType: type,
      startDate,
      endDate,
      members,
      lodging,
      transport,
      activities,
      season: resolvedSeason,
      purpose,
      items: draft ?? [],
      createdAt: Date.now(),
    };
    actions.addTrip(trip);
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-28">
      <header className="sticky top-0 z-10 bg-background/95 px-4 pb-2 pt-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="戻る"
            onClick={() => (step === 1 ? navigate({ to: "/" }) : setStep((s) => s - 1))}
            className="tap-target flex items-center justify-center"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <p className="text-sm font-bold text-muted-foreground">{step} / 5</p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </header>

      <main className="px-4 pt-4">
        {step === 1 && (
          <StepBox title="どこへ行きますか？" hint="市区町村や国名を入力してください">
            <input
              autoFocus
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setTravelType(null);
              }}
              placeholder="例）沖縄 / ハワイ"
              className="tap-target w-full rounded-xl border border-input bg-card px-4 py-3 text-base"
            />
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">判定：</span>
              {(["domestic", "overseas"] as TravelType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTravelType(t)}
                  aria-pressed={type === t}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm",
                    type === t
                      ? "border-primary bg-primary font-bold text-primary-foreground"
                      : "border-border bg-card",
                  )}
                >
                  {t === "domestic" ? "国内旅行" : "海外旅行"}
                </button>
              ))}
            </div>
          </StepBox>
        )}

        {step === 2 && (
          <StepBox title="いつ行きますか？" hint="出発日と帰着日を選んでください">
            <label className="block text-sm font-bold">出発日</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="tap-target mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-base"
            />
            <label className="mt-4 block text-sm font-bold">帰着日</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="tap-target mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-base"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {nights}泊{nights + 1}日の旅行です
            </p>
          </StepBox>
        )}

        {step === 3 && (
          <StepBox title="誰と行きますか？" hint="性別の入力は必要ありません">
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.id} className="rounded-xl bg-card p-3 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-2">
                    <input
                      value={m.name}
                      onChange={(e) =>
                        setMembers((ms) =>
                          ms.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      className="tap-target min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2"
                      aria-label="メンバー名"
                    />
                    {m.kind !== "self" && (
                      <button
                        type="button"
                        aria-label={`${m.name}を削除`}
                        onClick={() => setMembers((ms) => ms.filter((x) => x.id !== m.id))}
                        className="tap-target flex items-center justify-center text-destructive"
                      >
                        <Trash2 className="size-5" aria-hidden />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Object.keys(AGE_LABEL) as AgeGroup[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          setMembers((ms) =>
                            ms.map((x) =>
                              x.id === m.id
                                ? {
                                    ...x,
                                    ageGroup: a,
                                    kind:
                                      x.kind === "self"
                                        ? "self"
                                        : a === "adult"
                                          ? "adult"
                                          : "child",
                                  }
                                : x,
                            ),
                          )
                        }
                        aria-pressed={m.ageGroup === a}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs",
                          m.ageGroup === a
                            ? "border-primary bg-primary font-bold text-primary-foreground"
                            : "border-border bg-background",
                        )}
                      >
                        {AGE_LABEL[a]}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setMembers((ms) => [
                    ...ms,
                    { id: uid("m"), name: `大人${ms.length}`, kind: "adult", ageGroup: "adult" },
                  ])
                }
                className="tap-target flex-1 rounded-xl border border-primary py-2 text-sm font-bold text-primary"
              >
                大人を追加
              </button>
              <button
                type="button"
                onClick={() =>
                  setMembers((ms) => [
                    ...ms,
                    { id: uid("m"), name: `子ども${ms.length}`, kind: "child", ageGroup: "child" },
                  ])
                }
                className="tap-target flex-1 rounded-xl border border-primary py-2 text-sm font-bold text-primary"
              >
                子どもを追加
              </button>
            </div>
          </StepBox>
        )}

        {step === 4 && (
          <StepBox title="旅行の内容" hint="わからない項目は「未定」やスキップで大丈夫です">
            <p className="text-sm font-bold">宿泊施設</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LODGINGS.map((l) => (
                <Pick key={l} active={lodging === l} onClick={() => setLodging(l)}>
                  {l}
                </Pick>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold">主な移動手段</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRANSPORTS.map((t) => (
                <Pick key={t} active={transport === t} onClick={() => setTransport(t)}>
                  {t}
                </Pick>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold">旅行の目的</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRIP_PURPOSES.map((itemPurpose) => (
                <Pick
                  key={itemPurpose}
                  active={purpose === itemPurpose}
                  onClick={() => setPurpose(itemPurpose)}
                >
                  {itemPurpose}
                </Pick>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold">主な活動（任意・複数可）</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => (
                <Pick
                  key={a}
                  active={activities.includes(a)}
                  onClick={() =>
                    setActivities((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]))
                  }
                >
                  {a}
                </Pick>
              ))}
            </div>
          </StepBox>
        )}

        {step === 5 && draft && (
          <StepBox title="初期リストの確認" hint="不要な項目は外して、必要なものだけ残しましょう">
            <div className="rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
              <p className="font-bold">✨ 旅行条件からスマート生成</p>
              <p className="mt-1 text-xs">
                {destination.trim()}・{nights}泊{nights + 1}日・{SEASON_LABEL[resolvedSeason]}・
                {transport}・{purpose}・{members.length}人
              </p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {draft.length}件の候補を用意しました
            </p>
            <ul className="mt-3 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
              {draft.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-2 border-b border-border/70 px-3 py-2 last:border-b-0"
                >
                  <span className="text-lg" aria-hidden>
                    {i.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{i.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      優先度{PRIORITY_LABEL[i.priority]}・{BAG_LABEL[i.bag]}・{i.reason}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`${i.name}を候補から外す`}
                    onClick={() => setDraft((d) => (d ?? []).filter((x) => x.id !== i.id))}
                    className="tap-target flex items-center justify-center text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </StepBox>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-background/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        <button
          type="button"
          disabled={!canNext}
          onClick={step === 5 ? finish : goNext}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-40"
        >
          {step === 5 ? (
            <>
              <Check className="size-5" aria-hidden /> このリストで始める
            </>
          ) : (
            "次へ"
          )}
        </button>
      </div>
    </div>
  );
}

function StepBox({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Pick({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm",
        active
          ? "border-primary bg-primary font-bold text-primary-foreground"
          : "border-border bg-card",
      )}
    >
      {children}
    </button>
  );
}
