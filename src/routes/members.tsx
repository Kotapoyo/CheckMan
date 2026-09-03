import { createFileRoute } from "@tanstack/react-router";
import { Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/BottomNav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty } from "./schedule";
import { AGE_LABEL, BAG_LABEL, type AgeGroup, type BagKind } from "@/lib/trip-types";
import { actions, useCurrentTrip, useHydrated } from "@/lib/trip-store";
import { uid } from "@/lib/trip-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "メンバーと担当｜CheckMan" },
      {
        name: "description",
        content: "同行者ごとの未完了数とバッグ別の持ち物数を表示し、担当の重複や漏れを防ぎます。",
      },
      { property: "og:title", content: "メンバーと担当｜CheckMan" },
      { property: "og:description", content: "誰の準備が残っているかがひと目でわかります。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Members,
});

const BAGS: BagKind[] = ["carryon", "checked", "kidsbag", "wear", "undecided"];
const MEMBER_AGE_GROUPS: AgeGroup[] = ["adult", "teen", "child", "toddler", "baby"];

function Members() {
  const trip = useCurrentTrip();
  const hydrated = useHydrated();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAgeGroup, setNewMemberAgeGroup] = useState<AgeGroup>("adult");

  const resetNewMember = () => {
    setNewMemberName("");
    setNewMemberAgeGroup("adult");
  };

  if (!hydrated) return <div className="min-h-screen" />;
  if (!trip)
    return (
      <PageShell>
        <Empty />
      </PageShell>
    );

  const active = trip.items.filter((i) => i.status !== "unneeded");
  const unassigned = active.filter((i) => !i.assigneeId);

  return (
    <PageShell>
      <header className="px-4 pt-6">
        <h1 className="text-2xl font-bold">メンバー</h1>
        <p className="mt-1 text-sm text-muted-foreground">担当ごとの残りと、バッグ別の内訳です</p>
      </header>

      <section className="mt-4 space-y-2 px-4">
        {trip.members.map((m) => {
          const mine = active.filter((i) => i.assigneeId === m.id);
          const open = mine.filter((i) => i.status !== "packed");
          const removeMember = () => {
            const now = Date.now();
            actions.updateTrip(trip.id, {
              members: trip.members.filter((member) => member.id !== m.id),
              items: trip.items.map((item) =>
                item.assigneeId === m.id ? { ...item, assigneeId: null, updatedAt: now } : item,
              ),
            });
          };

          return (
            <div key={m.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                  {m.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{AGE_LABEL[m.ageGroup]}</p>
                </div>
                <p className="text-sm">
                  未完了 <span className="text-lg font-bold text-primary">{open.length}</span>
                  <span className="text-muted-foreground"> / {mine.length}</span>
                </p>
                {m.kind !== "self" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        aria-label={`${m.name}を削除`}
                        className="tap-target flex shrink-0 items-center justify-center text-destructive"
                      >
                        <Trash2 className="size-5" aria-hidden />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{m.name}を削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          {mine.length > 0
                            ? `${m.name}の担当になっている持ち物${mine.length}件は、未担当に戻ります。`
                            : "この操作は取り消せません。"}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={removeMember}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          );
        })}

        {unassigned.length > 0 && (
          <div className="rounded-2xl border border-destructive bg-card p-4">
            <p className="font-bold text-destructive">
              ⚠ 担当が未設定の持ち物が{unassigned.length}件あります
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {unassigned
                .slice(0, 5)
                .map((i) => i.name)
                .join("・")}
              {unassigned.length > 5 ? " ほか" : ""}
            </p>
          </div>
        )}

        <Dialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) resetNewMember();
          }}
        >
          <DialogTrigger asChild>
            <button
              type="button"
              className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl border border-primary py-3 font-bold text-primary"
            >
              <UserPlus className="size-5" aria-hidden />
              メンバーを追加
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const name = newMemberName.trim();
                if (!name) return;
                actions.updateTrip(trip.id, {
                  members: [
                    ...trip.members,
                    {
                      id: uid("m"),
                      name,
                      kind: newMemberAgeGroup === "adult" ? "adult" : "child",
                      ageGroup: newMemberAgeGroup,
                    },
                  ],
                });
                setAddDialogOpen(false);
                resetNewMember();
              }}
            >
              <DialogHeader>
                <DialogTitle>メンバーを追加</DialogTitle>
                <DialogDescription>名前と区分を入力してください。</DialogDescription>
              </DialogHeader>

              <div className="mt-5 space-y-5">
                <div>
                  <label htmlFor="new-member-name" className="text-sm font-bold">
                    名前
                  </label>
                  <input
                    id="new-member-name"
                    autoFocus
                    value={newMemberName}
                    onChange={(event) => setNewMemberName(event.target.value)}
                    placeholder="例）花子"
                    className="tap-target mt-2 w-full rounded-xl border border-input bg-card px-4 py-3 text-base"
                  />
                </div>

                <fieldset>
                  <legend className="text-sm font-bold">区分</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {MEMBER_AGE_GROUPS.map((ageGroup) => (
                      <button
                        key={ageGroup}
                        type="button"
                        aria-pressed={newMemberAgeGroup === ageGroup}
                        onClick={() => setNewMemberAgeGroup(ageGroup)}
                        className={cn(
                          "tap-target rounded-xl border py-3 text-sm",
                          newMemberAgeGroup === ageGroup
                            ? "border-primary bg-primary font-bold text-primary-foreground"
                            : "border-border bg-card",
                        )}
                      >
                        {AGE_LABEL[ageGroup]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="tap-target rounded-xl border border-input px-5 py-2.5 text-sm font-bold"
                  >
                    キャンセル
                  </button>
                </DialogClose>
                <button
                  type="submit"
                  disabled={!newMemberName.trim()}
                  className="tap-target rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
                >
                  追加する
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <section className="mt-6 px-4">
        <h2 className="text-sm font-bold text-muted-foreground">バッグ別の内訳</h2>
        <ul className="mt-2 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
          {BAGS.map((b) => {
            const list = active.filter((i) => i.bag === b);
            const packed = list.filter((i) => i.status === "packed").length;
            return (
              <li
                key={b}
                className="flex items-center gap-2 border-b border-border/70 px-4 py-3 last:border-b-0"
              >
                <span className="flex-1 text-sm font-medium">{BAG_LABEL[b]}</span>
                <span className="text-sm text-muted-foreground">
                  {packed} / {list.length}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </PageShell>
  );
}
