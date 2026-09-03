import { Link } from "@tanstack/react-router";
import { CalendarDays, ListChecks, Settings, ShoppingCart, Users } from "lucide-react";

const TABS = [
  { to: "/", label: "リスト", icon: ListChecks },
  { to: "/shopping", label: "買い物", icon: ShoppingCart },
  { to: "/schedule", label: "日程", icon: CalendarDays },
  { to: "/members", label: "メンバー", icon: Users },
  { to: "/settings", label: "設定", icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="tap-target flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground transition-colors"
              activeProps={{ className: "!text-primary font-bold" }}
            >
              <Icon className="size-6" aria-hidden />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
