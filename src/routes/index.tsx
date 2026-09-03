import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCircle, ChevronRight, ListChecks, Plus, Search, Sun, X } from "lucide-react";
import { PageShell } from "@/components/BottomNav";
import { ItemRow } from "@/components/ItemRow";
import {
  BAG_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  daysUntil,
  formatRange,
  type BagKind,
  type ItemStatus,
  type PackItem,
  type Priority,
} from "@/lib/trip-types";
import { actions, progressOf, useCurrentTrip, useHydrated } from "@/lib/trip-store";
import { uid } from "@/lib/trip-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CheckMan｜旅行の持ち物を担当・バッグ別に管理" },
      {
        name: "description",
        content:
          "誰が・いつまでに・どのバッグへ入れるかまで管理できる旅行準備アプリ。忘れ物と準備の重複を減らします。",
      },
      { property: "og:title", content: "CheckMan｜旅行の持ち物を担当・バッグ別に管理" },
      {
        property: "og:description",
        content: "家族旅行の持ち物を担当別・バッグ別に管理。出発前の最終確認までサポートします。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Filter = "all" | "open" | "high" | ItemStatus;
type SortKey = "created" | "assignee" | "status" | "priority" | "bag";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "open", label: "未完了" },
  { key: "high", label: "優先度 高" },
  { key: "buy", label: "買う" },
  { key: "preparing", label: "準備中" },
  { key: "packed", label: "完了" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "priority", label: "優先度順" },
  { key: "assignee", label: "担当者別" },
  { key: "status", label: "状態別" },
  { key: "bag", label: "バッグ別" },
  { key: "created", label: "追加順" },
];

const STATUS_ORDER: Record<ItemStatus, number> = {
  not_started: 0,
  buy: 1,
  preparing: 2,
  packed: 3,
  unneeded: 4,
};

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, mid: 1, low: 2 };
const BAG_ORDER: Record<BagKind, number> = {
  carryon: 0,
  checked: 1,
  kidsbag: 2,
  wear: 3,
  undecided: 4,
};

function Home() {
  const trip = useCurrentTrip();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [bulkSelecting, setBulkSelecting] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => new Set());
  const [bulkEditing, setBulkEditing] = useState(false);

  const progress = trip ? progressOf(trip) : null;
  const left = trip ? daysUntil(trip.startDate) : 0;

  const items = useMemo(() => {
    if (!trip) return [];
    const query = searchQuery.trim().toLocaleLowerCase("ja");
    const memberNames = new Map(trip.members.map((member) => [member.id, member.name]));
    const filtered = trip.items.filter((item) => {
      const matchesFilter =
        filter === "all"
          ? item.status !== "unneeded"
          : filter === "open"
            ? item.status !== "packed" && item.status !== "unneeded"
            : filter === "high"
              ? item.priority === "high" && item.status !== "unneeded"
              : item.status === filter;

      if (!matchesFilter || !query) return matchesFilter;

      const searchable = [
        item.name,
        item.reason,
        item.memo,
        STATUS_LABEL[item.status],
        BAG_LABEL[item.bag],
        item.assigneeId ? memberNames.get(item.assigneeId) : "担当未定",
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ja");
      return searchable.includes(query);
    });

    if (sortKey === "created") return filtered;

    const effectiveSortKey =
      (sortKey === "assignee" && new Set(filtered.map((item) => item.assigneeId)).size <= 1) ||
      (sortKey === "status" && new Set(filtered.map((item) => item.status)).size <= 1) ||
      (sortKey === "bag" && !filtered.some((item) => item.bag !== "undecided"))
        ? "priority"
        : sortKey;

    return [...filtered].sort((a, b) => {
      let result = 0;
      const priorityResult = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (effectiveSortKey === "assignee") {
        const aName = a.assigneeId ? (memberNames.get(a.assigneeId) ?? "") : "\uffff";
        const bName = b.assigneeId ? (memberNames.get(b.assigneeId) ?? "") : "\uffff";
        result = aName.localeCompare(bName, "ja");
      } else if (effectiveSortKey === "status") {
        result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      } else if (effectiveSortKey === "priority") {
        result = priorityResult;
      } else if (effectiveSortKey === "bag") {
        result = BAG_ORDER[a.bag] - BAG_ORDER[b.bag];
      }
      return result || priorityResult || a.name.localeCompare(b.name, "ja");
    });
  }, [trip, filter, searchQuery, sortKey]);

  if (!hydrated) {
    return <div className="min-h-screen" />;
  }

  if (!trip) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <span className="text-5xl" aria-hidden>
            🧳
          </span>
          <h1 className="mt-4 text-2xl font-bold">CheckMan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            誰が・いつまでに・どのバッグへ入れるか。
            <br />
            旅行の準備をまとめて管理しましょう。
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/setup" })}
            className="tap-target mt-8 w-full rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
          >
            旅行をつくる
          </button>
        </div>
      </PageShell>
    );
  }

  const criticalOpen = trip.items.filter(
    (i) => i.priority === "high" && i.status !== "packed" && i.status !== "unneeded",
  );
  const showReminder = left <= 7 && criticalOpen.length > 0;
  const current = trip.items.find((i) => i.id === openItem) ?? null;
  const allVisibleSelected =
    items.length > 0 && items.every((item) => selectedItemIds.has(item.id));

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((currentIds) => {
      const next = new Set(currentIds);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const finishBulkEditing = () => {
    setBulkEditing(false);
    setBulkSelecting(false);
    setSelectedItemIds(new Set());
  };

  return (
    <PageShell>
      <header className="px-4 pt-6">
        <div className="flex items-start gap-3">
          <Sun className="mt-1 size-8 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[26px] font-bold leading-tight">{trip.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatRange(trip.startDate, trip.endDate)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
              left <= 3
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {left > 0 ? `あと${left}日` : left === 0 ? "出発当日" : "旅行中・終了"}
          </span>
        </div>
      </header>

      <section className="mt-4 px-4">
        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold">
              荷造り <span className="text-2xl text-primary">{progress!.done}</span>
              <span className="text-muted-foreground"> / {progress!.total}</span>
            </p>
            <p className="text-lg font-bold text-primary">{progress!.percent}%</p>
          </div>
          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={progress!.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="荷造りの進捗"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress!.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            重要な未完了 {criticalOpen.length}件・担当未設定{" "}
            {trip.items.filter((i) => !i.assigneeId && i.status !== "unneeded").length}件
          </p>
        </div>
      </section>

      {showReminder && (
        <section className="mt-3 px-4">
          <button
            type="button"
            onClick={() => setChecklistOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-destructive px-4 py-3 text-left text-destructive-foreground"
          >
            <AlertCircle className="size-6 shrink-0" aria-hidden />
            <span className="flex-1">
              <span className="block font-bold">
                {left === 0 ? "出発当日です" : `出発の${left}日前です`}
              </span>
              <span className="block text-xs opacity-90">
                重要な未完了が{criticalOpen.length}件あります。最終確認しましょう
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0" aria-hidden />
          </button>
        </section>
      )}

      <div className="sticky top-0 z-10 mt-4 bg-background/95 px-4 py-2 backdrop-blur">
        <div className="mb-2 flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">持ち物を検索</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="text"
              role="searchbox"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="持ち物を検索"
              className="tap-target w-full rounded-xl border border-input bg-card py-2 pl-9 pr-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="検索内容を消去"
                className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-muted-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </label>
          <label>
            <span className="sr-only">並び替え</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="tap-target max-w-28 rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold"
              aria-label="持ち物の並び替え"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm",
                filter === f.key
                  ? "border-primary bg-primary font-bold text-primary-foreground"
                  : "border-border bg-card text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-2 border-t border-border/70 pt-2">
          {bulkSelecting ? (
            <>
              <span className="mr-auto text-xs font-bold text-primary">
                {selectedItemIds.size}件選択中
              </span>
              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => {
                  setSelectedItemIds((currentIds) => {
                    const next = new Set(currentIds);
                    items.forEach((item) =>
                      allVisibleSelected ? next.delete(item.id) : next.add(item.id),
                    );
                    return next;
                  });
                }}
                className="rounded-lg px-2 py-1.5 text-xs font-bold text-primary disabled:opacity-40"
              >
                {allVisibleSelected ? "表示中を解除" : "表示中を全選択"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkSelecting(false);
                  setSelectedItemIds(new Set());
                }}
                className="rounded-lg px-2 py-1.5 text-xs font-bold text-muted-foreground"
              >
                キャンセル
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectedItemIds(new Set());
                setBulkSelecting(true);
              }}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-primary"
            >
              <ListChecks className="size-4" aria-hidden />
              一括編集
            </button>
          )}
        </div>
      </div>

      <section className="px-4">
        <ul className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
          {items.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              該当する持ち物はありません
            </li>
          )}
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              members={trip.members}
              onToggle={() =>
                actions.updateItem(trip.id, item.id, {
                  status: item.status === "packed" ? "not_started" : "packed",
                })
              }
              onOpen={() => setOpenItem(item.id)}
              onQuantityChange={(quantity) => actions.updateItem(trip.id, item.id, { quantity })}
              selectionMode={bulkSelecting}
              selected={selectedItemIds.has(item.id)}
              onSelect={() => toggleItemSelection(item.id)}
            />
          ))}
        </ul>
      </section>

      {bulkSelecting ? (
        <button
          type="button"
          disabled={selectedItemIds.size === 0}
          onClick={() => setBulkEditing(true)}
          className="fixed bottom-24 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)] -translate-x-1/2 rounded-2xl bg-primary py-3 font-bold text-primary-foreground shadow-lg disabled:opacity-40"
        >
          選択した{selectedItemIds.size}件を編集
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-label="持ち物を追加"
          className="fixed bottom-24 left-1/2 z-30 ml-[104px] flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <Plus className="size-7" aria-hidden />
        </button>
      )}

      {current && (
        <ItemSheet
          item={current}
          tripId={trip.id}
          members={trip.members}
          onClose={() => setOpenItem(null)}
        />
      )}
      {adding && (
        <AddSheet tripId={trip.id} members={trip.members} onClose={() => setAdding(false)} />
      )}
      {bulkEditing && (
        <BulkEditSheet
          tripId={trip.id}
          itemIds={[...selectedItemIds]}
          members={trip.members}
          onClose={() => setBulkEditing(false)}
          onApplied={finishBulkEditing}
        />
      )}
      {checklistOpen && (
        <FinalCheckSheet items={criticalOpen} onClose={() => setChecklistOpen(false)} />
      )}
    </PageShell>
  );
}

function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/40"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="tap-target flex items-center justify-center"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const STATUSES: ItemStatus[] = ["not_started", "buy", "preparing", "packed", "unneeded"];
const ADD_STATUSES: ItemStatus[] = ["buy", "preparing", "packed"];
const BAGS: BagKind[] = ["carryon", "checked", "kidsbag", "wear", "undecided"];
const PRIORITIES: Priority[] = ["high", "mid", "low"];

function Chip({
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
        "rounded-full border px-3 py-2 text-sm",
        active
          ? "border-primary bg-primary font-bold text-primary-foreground"
          : "border-border bg-background",
      )}
    >
      {children}
    </button>
  );
}

function ItemSheet({
  item,
  tripId,
  members,
  onClose,
}: {
  item: PackItem;
  tripId: string;
  members: { id: string; name: string }[];
  onClose: () => void;
}) {
  const set = (patch: Partial<PackItem>) => actions.updateItem(tripId, item.id, patch);
  return (
    <Sheet title={`${item.emoji} ${item.name}`} onClose={onClose}>
      <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">{item.reason}</p>

      <Field label="準備の状態">
        {STATUSES.map((s) => (
          <Chip
            key={s}
            active={item.status === s}
            onClick={() => set(s === "buy" ? { status: s, purchased: false } : { status: s })}
          >
            {STATUS_LABEL[s]}
          </Chip>
        ))}
      </Field>

      <Field label="担当者">
        {members.map((m) => (
          <Chip
            key={m.id}
            active={item.assigneeId === m.id}
            onClick={() => set({ assigneeId: m.id })}
          >
            {m.name}
          </Chip>
        ))}
        <Chip active={!item.assigneeId} onClick={() => set({ assigneeId: null })}>
          未設定
        </Chip>
      </Field>

      <Field label="入れる場所">
        {BAGS.map((b) => (
          <Chip key={b} active={item.bag === b} onClick={() => set({ bag: b })}>
            {BAG_LABEL[b]}
          </Chip>
        ))}
      </Field>

      <Field label="優先度">
        {PRIORITIES.map((p) => (
          <Chip key={p} active={item.priority === p} onClick={() => set({ priority: p })}>
            {PRIORITY_LABEL[p]}
          </Chip>
        ))}
      </Field>

      <label className="mt-4 block text-sm font-bold">メモ</label>
      <textarea
        className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm"
        rows={2}
        value={item.memo ?? ""}
        onChange={(e) => set({ memo: e.target.value })}
        placeholder="サイズ・数量など"
      />

      <button
        type="button"
        onClick={() => {
          actions.removeItem(tripId, item.id);
          onClose();
        }}
        className="tap-target mt-4 w-full rounded-xl border border-destructive px-4 py-2 text-sm font-bold text-destructive"
      >
        この持ち物を削除
      </button>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function BulkEditSheet({
  tripId,
  itemIds,
  members,
  onClose,
  onApplied,
}: {
  tripId: string;
  itemIds: string[];
  members: { id: string; name: string }[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const [status, setStatus] = useState<ItemStatus | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null | undefined>(undefined);
  const [bag, setBag] = useState<BagKind | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const hasChanges =
    status !== null || assigneeId !== undefined || bag !== null || priority !== null;

  return (
    <Sheet title={`${itemIds.length}件を一括編集`} onClose={onClose}>
      <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
        変更する項目だけ選択してください。選択しない項目は現在の設定を維持します。
      </p>

      <Field label="準備の状態">
        {STATUSES.map((itemStatus) => (
          <Chip
            key={itemStatus}
            active={status === itemStatus}
            onClick={() => setStatus(status === itemStatus ? null : itemStatus)}
          >
            {STATUS_LABEL[itemStatus]}
          </Chip>
        ))}
      </Field>

      <Field label="担当者">
        {members.map((member) => (
          <Chip
            key={member.id}
            active={assigneeId === member.id}
            onClick={() => setAssigneeId(assigneeId === member.id ? undefined : member.id)}
          >
            {member.name}
          </Chip>
        ))}
        <Chip
          active={assigneeId === null}
          onClick={() => setAssigneeId(assigneeId === null ? undefined : null)}
        >
          未設定
        </Chip>
      </Field>

      <Field label="入れる場所">
        {BAGS.map((itemBag) => (
          <Chip
            key={itemBag}
            active={bag === itemBag}
            onClick={() => setBag(bag === itemBag ? null : itemBag)}
          >
            {BAG_LABEL[itemBag]}
          </Chip>
        ))}
      </Field>

      <Field label="優先度">
        {PRIORITIES.map((itemPriority) => (
          <Chip
            key={itemPriority}
            active={priority === itemPriority}
            onClick={() => setPriority(priority === itemPriority ? null : itemPriority)}
          >
            {PRIORITY_LABEL[itemPriority]}
          </Chip>
        ))}
      </Field>

      <button
        type="button"
        disabled={!hasChanges}
        onClick={() => {
          const patch: Partial<PackItem> = {};
          if (status !== null) {
            patch.status = status;
            if (status === "buy") patch.purchased = false;
          }
          if (assigneeId !== undefined) patch.assigneeId = assigneeId;
          if (bag !== null) patch.bag = bag;
          if (priority !== null) patch.priority = priority;
          actions.updateItems(tripId, itemIds, patch);
          onApplied();
        }}
        className="tap-target mt-6 w-full rounded-2xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40"
      >
        {itemIds.length}件に適用する
      </button>
    </Sheet>
  );
}

function AddSheet({
  tripId,
  members,
  onClose,
}: {
  tripId: string;
  members: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ItemStatus>("preparing");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("mid");
  const [bag, setBag] = useState<BagKind>("undecided");

  return (
    <Sheet title="持ち物を追加" onClose={onClose}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例）サングラス"
        className="tap-target w-full rounded-xl border border-input bg-background px-3 py-3 text-base"
      />
      <Field label="準備の状態">
        {ADD_STATUSES.map((itemStatus) => (
          <Chip
            key={itemStatus}
            active={status === itemStatus}
            onClick={() => setStatus(itemStatus)}
          >
            {STATUS_LABEL[itemStatus]}
          </Chip>
        ))}
      </Field>
      <Field label="担当者">
        {members.map((member) => (
          <Chip
            key={member.id}
            active={assigneeId === member.id}
            onClick={() => setAssigneeId(member.id)}
          >
            {member.name}
          </Chip>
        ))}
        <Chip active={!assigneeId} onClick={() => setAssigneeId(null)}>
          未設定
        </Chip>
      </Field>
      <Field label="優先度">
        {PRIORITIES.map((p) => (
          <Chip key={p} active={priority === p} onClick={() => setPriority(p)}>
            {PRIORITY_LABEL[p]}
          </Chip>
        ))}
      </Field>
      <Field label="入れる場所">
        {BAGS.map((b) => (
          <Chip key={b} active={bag === b} onClick={() => setBag(b)}>
            {BAG_LABEL[b]}
          </Chip>
        ))}
      </Field>
      <button
        type="button"
        disabled={!name.trim()}
        onClick={() => {
          actions.addItem(tripId, {
            id: uid("item"),
            name: name.trim(),
            emoji: "🧳",
            priority,
            status,
            assigneeId,
            bag,
            reason: "自分で追加した持ち物です。",
            updatedAt: Date.now(),
          });
          onClose();
        }}
        className="tap-target mt-6 w-full rounded-2xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40"
      >
        追加する
      </button>
    </Sheet>
  );
}

function FinalCheckSheet({ items, onClose }: { items: PackItem[]; onClose: () => void }) {
  return (
    <Sheet title="出発前の最終確認" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        書類・充電・財布や鍵などの重要な持ち物が残っています。
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm"
          >
            <span aria-hidden>{i.emoji}</span>
            <span className="flex-1 font-medium">{i.name}</span>
            <span className="text-xs text-muted-foreground">{STATUS_LABEL[i.status]}</span>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
