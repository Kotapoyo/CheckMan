import { createFileRoute } from "@tanstack/react-router";
import { ja } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { PageShell } from "@/components/BottomNav";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { STATUS_LABEL, daysUntil, formatRange } from "@/lib/trip-types";
import { actions, progressOf, useCurrentTrip, useHydrated } from "@/lib/trip-store";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "日程と出発前チェック｜CheckMan" },
      {
        name: "description",
        content:
          "出発7日前・3日前・前日・当日の確認事項と、残っている重要な持ち物をまとめて確認できます。",
      },
      { property: "og:title", content: "日程と出発前チェック｜CheckMan" },
      { property: "og:description", content: "出発までの節目ごとに、やるべき確認を表示します。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Schedule,
});

const MILESTONES = [
  { at: 7, title: "7日前", body: "書類・チケット・予約を確認し、買う必要のあるものを注文する" },
  { at: 3, title: "3日前", body: "パスポートやチケットを再確認する" },
  { at: 1, title: "前日", body: "充電・書類・財布・鍵・身分証を最終確認して荷造りを終える" },
  { at: 0, title: "当日", body: "身につけるもの、機内持込を出発前に手元で確認する" },
];

function toLocalDate(value: string) {
  const parts = value.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year === undefined || month === undefined || day === undefined) {
    return new Date(Number.NaN);
  }
  return new Date(year, month - 1, day);
}

function Schedule() {
  const trip = useCurrentTrip();
  const hydrated = useHydrated();
  if (!hydrated) return <div className="min-h-screen" />;

  if (!trip) {
    return (
      <PageShell>
        <Empty />
      </PageShell>
    );
  }

  const left = daysUntil(trip.startDate);
  const untilReturn = daysUntil(trip.endDate);
  const startDate = toLocalDate(trip.startDate);
  const endDate = toLocalDate(trip.endDate);
  const completedMilestones = trip.completedMilestones ?? [];
  const p = progressOf(trip);
  const critical = trip.items.filter(
    (i) => i.priority === "high" && i.status !== "packed" && i.status !== "unneeded",
  );

  return (
    <PageShell>
      <header className="px-4 pt-6">
        <h1 className="text-2xl font-bold">日程</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatRange(trip.startDate, trip.endDate)}
        </p>
      </header>

      <section className="mt-4 px-4">
        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <CalendarDays className="size-6 text-primary" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground">今日から出発日まで</p>
              {left > 0 ? (
                <p className="leading-none">
                  あと <span className="text-4xl font-bold text-primary">{left}</span> 日
                </p>
              ) : (
                <p className="text-xl font-bold">
                  {left === 0
                    ? "本日出発です"
                    : untilReturn >= 0
                      ? `旅行中・帰着まであと${untilReturn}日`
                      : "旅行は終了しました"}
                </p>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            荷造り {p.done} / {p.total}（{p.percent}%）・重要な未完了 {critical.length}件
          </p>
        </div>
      </section>

      <section className="mt-4 px-4">
        <h2 className="text-sm font-bold text-muted-foreground">旅行カレンダー</h2>
        <div className="mt-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <Calendar
            mode="range"
            defaultMonth={startDate}
            selected={{ from: startDate, to: endDate }}
            locale={ja}
            showOutsideDays
            className="w-full bg-card p-0 [--cell-size:2.5rem]"
            classNames={{ root: "w-full", month: "w-full" }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-accent ring-1 ring-border" aria-hidden />
              本日
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden />
              出発日・帰着日
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full bg-accent" aria-hidden />
              旅行期間
            </span>
            <span className="ml-auto text-muted-foreground">
              {formatRange(trip.startDate, trip.endDate)}
            </span>
          </div>
        </div>
      </section>

      <section className="mt-4 px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-muted-foreground">出発前の確認</h2>
          <span className="text-xs font-bold text-primary">
            {completedMilestones.length} / {MILESTONES.length} 完了
          </span>
        </div>
        <ul className="mt-2 space-y-2">
          {MILESTONES.map((m) => {
            const active = left <= m.at;
            const checked = completedMilestones.includes(m.at);
            const checkboxId = `milestone-${m.at}`;
            return (
              <li
                key={m.at}
                className={`rounded-2xl border p-4 ${
                  checked
                    ? "border-primary/40 bg-primary/5"
                    : active
                      ? "border-primary bg-card"
                      : "border-border bg-card/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    onCheckedChange={() =>
                      actions.updateTrip(trip.id, {
                        completedMilestones: checked
                          ? completedMilestones.filter((at) => at !== m.at)
                          : [...completedMilestones, m.at],
                      })
                    }
                    aria-label={`${m.title}の確認を${checked ? "未完了に戻す" : "完了にする"}`}
                    className="mt-0.5 size-6 rounded-md"
                  />
                  <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{m.title}</span>
                      <span
                        className={`ml-auto text-xs ${checked ? "font-bold text-primary" : "text-muted-foreground"}`}
                      >
                        {checked ? "確認済み" : active ? "確認する" : "まだ先です"}
                      </span>
                    </span>
                    <span
                      className={`mt-1 block text-sm text-muted-foreground ${checked ? "line-through opacity-70" : ""}`}
                    >
                      {m.body}
                    </span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 px-4">
        <h2 className="text-sm font-bold text-muted-foreground">残っている重要な持ち物</h2>
        <ul className="mt-2 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
          {critical.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              重要な持ち物はすべて準備できています
            </li>
          )}
          {critical.map((i) => (
            <li
              key={i.id}
              className="flex items-center gap-2 border-b border-border/70 px-4 py-3 last:border-b-0"
            >
              <span aria-hidden>{i.emoji}</span>
              <span className="flex-1 text-sm font-medium">{i.name}</span>
              <span className="text-xs text-muted-foreground">{STATUS_LABEL[i.status]}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

export function Empty() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 text-center text-sm text-muted-foreground">
      まだ旅行がありません。リストのタブから旅行をつくりましょう。
    </div>
  );
}
