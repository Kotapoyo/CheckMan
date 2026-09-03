import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { PageShell } from "@/components/BottomNav";
import { formatRange } from "@/lib/trip-types";
import { actions, progressOf, useCurrentTrip, useTripState, useHydrated } from "@/lib/trip-store";
import { uid } from "@/lib/trip-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "設定と旅行の管理｜CheckMan" },
      {
        name: "description",
        content:
          "旅行名の変更、過去の旅行の複製、データの削除ができます。データは端末内にのみ保存されます。",
      },
      { property: "og:title", content: "設定と旅行の管理｜CheckMan" },
      { property: "og:description", content: "旅行の複製や削除、端末内データの管理。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const state = useTripState();
  const trip = useCurrentTrip();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  if (!hydrated) return <div className="min-h-screen" />;

  return (
    <PageShell>
      <header className="px-4 pt-6">
        <h1 className="text-2xl font-bold">設定</h1>
      </header>

      {trip && (
        <section className="mt-4 px-4">
          <h2 className="text-sm font-bold text-muted-foreground">旅行名</h2>
          <input
            value={name || trip.name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && actions.updateTrip(trip.id, { name: name.trim() })}
            className="tap-target mt-2 w-full rounded-xl border border-input bg-card px-4 py-3"
            aria-label="旅行名"
          />
        </section>
      )}

      <section className="mt-6 px-4">
        <h2 className="text-sm font-bold text-muted-foreground">保存している旅行</h2>
        <ul className="mt-2 space-y-2">
          {state.trips.map((t) => {
            const p = progressOf(t);
            const active = t.id === trip?.id;
            return (
              <li
                key={t.id}
                className={cn(
                  "rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]",
                  active ? "border-primary" : "border-transparent",
                )}
              >
                <button
                  type="button"
                  onClick={() => actions.selectTrip(t.id)}
                  className="w-full text-left"
                >
                  <p className="font-bold">
                    {t.name}
                    {active && <span className="ml-2 text-xs text-primary">表示中</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRange(t.startDate, t.endDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    荷造り {p.done} / {p.total}（{p.percent}%）
                  </p>
                </button>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      actions.addTrip({
                        ...t,
                        id: uid("trip"),
                        name: `${t.name}のコピー`,
                        createdAt: Date.now(),
                        items: t.items.map((i) => ({
                          ...i,
                          id: uid("item"),
                          status: "not_started" as const,
                        })),
                      });
                    }}
                    className="tap-target flex flex-1 items-center justify-center gap-1 rounded-xl border border-primary py-2 text-sm font-bold text-primary"
                  >
                    <Copy className="size-4" aria-hidden /> 複製する
                  </button>
                  <button
                    type="button"
                    onClick={() => actions.deleteTrip(t.id)}
                    className="tap-target flex flex-1 items-center justify-center gap-1 rounded-xl border border-destructive py-2 text-sm font-bold text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden /> 削除する
                  </button>
                </div>
              </li>
            );
          })}
          {state.trips.length === 0 && (
            <li className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
              保存された旅行はありません
            </li>
          )}
        </ul>

        <button
          type="button"
          onClick={() => navigate({ to: "/setup" })}
          className="tap-target mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-bold text-primary-foreground"
        >
          <Plus className="size-5" aria-hidden /> 新しい旅行をつくる
        </button>
      </section>

      <section className="mt-8 px-4">
        <h2 className="text-sm font-bold text-muted-foreground">データとプライバシー</h2>
        <p className="mt-2 rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
          旅行・持ち物・準備状態はこの端末の中だけに保存され、オフラインでも確認・更新できます。
          パスポート番号やカード番号、パスワードは保存しません。
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("この端末に保存したすべての旅行データを削除します。よろしいですか？")) {
              actions.clearAll();
            }
          }}
          className="tap-target mt-3 w-full rounded-2xl border border-destructive py-3 text-sm font-bold text-destructive"
        >
          端末内のデータをすべて削除
        </button>
      </section>
    </PageShell>
  );
}
