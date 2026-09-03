import { Check, ChevronRight, Minus, Plus } from "lucide-react";
import {
  BAG_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Member,
  type PackItem,
} from "@/lib/trip-types";
import { cn } from "@/lib/utils";

const PRIORITY_CLASS: Record<PackItem["priority"], string> = {
  high: "bg-high text-high-foreground",
  mid: "bg-mid text-mid-foreground",
  low: "bg-low text-low-foreground",
};

const QUANTITY_ITEMS = new Set(["着替え（上）", "着替え（下）", "下着・靴下"]);

export function ItemRow({
  item,
  members,
  onToggle,
  onOpen,
  onQuantityChange,
  selectionMode = false,
  selected = false,
  onSelect,
}: {
  item: PackItem;
  members: Member[];
  onToggle: () => void;
  onOpen: () => void;
  onQuantityChange: (quantity: number) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const packed = item.status === "packed";
  const checked = selectionMode ? selected : packed;
  const assignee = members.find((m) => m.id === item.assigneeId);
  const hasQuantity = QUANTITY_ITEMS.has(item.name);
  const quantity = item.quantity ?? 1;
  const quantityUnit = item.name === "下着・靴下" ? "組" : "着";

  return (
    <li
      className={cn(
        "flex items-center gap-2 border-b border-border/70 px-3 last:border-b-0",
        selectionMode && selected && "bg-primary/5",
      )}
    >
      <button
        type="button"
        onClick={selectionMode ? onSelect : onToggle}
        aria-pressed={checked}
        aria-label={selectionMode ? `${item.name}を選択` : `${item.name}をバッグに入れた`}
        className={cn(
          "tap-target my-1 flex size-11 shrink-0 items-center justify-center rounded-lg",
          checked ? "text-primary-foreground" : "text-transparent",
        )}
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md border-2 transition-colors",
            checked ? "border-primary bg-primary" : "border-border bg-card",
          )}
        >
          <Check className="size-5" strokeWidth={3} aria-hidden />
        </span>
      </button>

      <button
        type="button"
        onClick={selectionMode ? onSelect : onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-lg"
          aria-hidden
        >
          {item.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[15px] font-medium",
              packed && "text-muted-foreground line-through",
            )}
          >
            {item.name}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("rounded px-1.5 py-0.5 font-bold", PRIORITY_CLASS[item.priority])}>
              {PRIORITY_LABEL[item.priority]}
            </span>
            <span className="truncate">{assignee?.name ?? "担当未定"}</span>
            <span className="rounded bg-secondary px-1.5 py-0.5">{BAG_LABEL[item.bag]}</span>
            {!packed && item.status !== "not_started" && (
              <span className="rounded bg-accent px-1.5 py-0.5 text-accent-foreground">
                {STATUS_LABEL[item.status]}
              </span>
            )}
          </span>
        </span>
      </button>
      {hasQuantity && !selectionMode && (
        <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-input bg-background">
          <button
            type="button"
            disabled={quantity <= 1}
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            aria-label={`${item.name}の個数を減らす`}
            className="flex size-8 items-center justify-center text-primary disabled:text-muted-foreground disabled:opacity-40"
          >
            <Minus className="size-3.5" aria-hidden />
          </button>
          <span
            className="min-w-8 border-x border-input px-1 text-center text-sm font-bold"
            aria-label={`${item.name}の個数 ${quantity}${quantityUnit}`}
          >
            {quantity}
            <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
              {quantityUnit}
            </span>
          </span>
          <button
            type="button"
            disabled={quantity >= 99}
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
            aria-label={`${item.name}の個数を増やす`}
            className="flex size-8 items-center justify-center text-primary disabled:text-muted-foreground disabled:opacity-40"
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
      {!selectionMode && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${item.name}の詳細を開く`}
          className="flex size-8 shrink-0 items-center justify-center text-muted-foreground"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </li>
  );
}
