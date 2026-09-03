import { createFileRoute } from "@tanstack/react-router";
import { Check, ShoppingCart } from "lucide-react";
import { PageShell } from "@/components/BottomNav";
import { Checkbox } from "@/components/ui/checkbox";
import { actions, useCurrentTrip, useHydrated } from "@/lib/trip-store";
import { Empty } from "./schedule";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "買い物リスト｜CheckMan" },
      {
        name: "description",
        content: "旅行前に購入する持ち物の進捗と金額をまとめて管理できます。",
      },
      { property: "og:title", content: "買い物リスト｜CheckMan" },
      { property: "og:description", content: "購入予定の持ち物と金額をまとめて確認できます。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shopping,
});

const yen = new Intl.NumberFormat("ja-JP");

function Shopping() {
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

  const shoppingItems = trip.items
    .filter((item) => item.status === "buy" || item.purchased)
    .sort((a, b) => Number(Boolean(a.purchased)) - Number(Boolean(b.purchased)));
  const purchasedCount = shoppingItems.filter((item) => item.purchased).length;
  const total = shoppingItems.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const purchasedTotal = shoppingItems.reduce(
    (sum, item) => sum + (item.purchased ? (item.price ?? 0) : 0),
    0,
  );
  const percent = shoppingItems.length
    ? Math.round((purchasedCount / shoppingItems.length) * 100)
    : 0;

  return (
    <PageShell>
      <header className="px-4 pt-6">
        <h1 className="text-2xl font-bold">買い物リスト</h1>
        <p className="mt-1 text-sm text-muted-foreground">「買う」にした持ち物をまとめています</p>
      </header>

      <section className="mt-4 px-4">
        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="size-6 text-primary" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                購入済み <span className="text-2xl text-primary">{purchasedCount}</span>
                <span className="text-muted-foreground"> / {shoppingItems.length}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                購入済み金額 ¥{yen.format(purchasedTotal)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">合計</p>
              <p className="text-lg font-bold">¥{yen.format(total)}</p>
            </div>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-label="買い物の進捗"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>

      <section className="mt-4 px-4">
        <ul className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
          {shoppingItems.length === 0 && (
            <li className="px-6 py-12 text-center">
              <ShoppingCart className="mx-auto size-10 text-muted-foreground" aria-hidden />
              <p className="mt-3 font-bold">買うものはありません</p>
              <p className="mt-1 text-sm text-muted-foreground">
                持ち物の状態を「買う」にすると、ここへ追加されます。
              </p>
            </li>
          )}
          {shoppingItems.map((item) => {
            const member = trip.members.find((candidate) => candidate.id === item.assigneeId);
            const purchased = Boolean(item.purchased);
            const checkboxId = `shopping-${item.id}`;

            return (
              <li
                key={item.id}
                className="flex items-center gap-3 border-b border-border/70 px-3 py-3 last:border-b-0"
              >
                <Checkbox
                  id={checkboxId}
                  checked={purchased}
                  onCheckedChange={(checked) =>
                    actions.updateItem(trip.id, item.id, {
                      purchased: checked === true,
                      status: checked === true ? "preparing" : "buy",
                    })
                  }
                  aria-label={`${item.name}を${purchased ? "未購入に戻す" : "購入済みにする"}`}
                  className="size-6 rounded-md"
                />
                <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
                  <span
                    className={`block truncate font-medium ${purchased ? "text-muted-foreground line-through" : ""}`}
                  >
                    {item.emoji} {item.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {member?.name ?? "担当未定"}
                  </span>
                </label>
                <label className="flex shrink-0 items-center gap-1 rounded-lg border border-input bg-background px-2">
                  <span className="text-sm text-muted-foreground">¥</span>
                  <span className="sr-only">{item.name}の価格</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={item.price ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      actions.updateItem(trip.id, item.id, {
                        price: value === "" ? null : Math.max(0, Number(value)),
                      });
                    }}
                    placeholder="0"
                    className="tap-target w-20 bg-transparent py-2 text-right text-sm outline-none"
                  />
                </label>
                {purchased && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </li>
            );
          })}
        </ul>
      </section>
    </PageShell>
  );
}
