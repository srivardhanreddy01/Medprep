"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
  disabled?: boolean;
  content: React.ReactNode;
}

/** Accessible tabs (WAI-ARIA tabs pattern with roving focus). Syncs the active tab to ?tab=. */
export function Tabs({ items, initial, className }: { items: TabItem[]; initial?: string; className?: string }) {
  const [active, setActive] = React.useState(initial && items.some((i) => i.id === initial) ? initial : items[0]?.id);
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const enabled = items.filter((i) => !i.disabled);

  const select = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  };

  const onKey = (e: React.KeyboardEvent, id: string) => {
    const idx = enabled.findIndex((i) => i.id === id);
    let next: TabItem | undefined;
    if (e.key === "ArrowRight") next = enabled[(idx + 1) % enabled.length];
    if (e.key === "ArrowLeft") next = enabled[(idx - 1 + enabled.length) % enabled.length];
    if (e.key === "Home") next = enabled[0];
    if (e.key === "End") next = enabled[enabled.length - 1];
    if (next) {
      e.preventDefault();
      select(next.id);
      refs.current[next.id]?.focus();
    }
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label="Explanation sections" className="flex gap-1 overflow-x-auto border-b pb-px [scrollbar-width:thin]">
        {items.map((item) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[item.id] = el;
            }}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={active === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={active === item.id ? 0 : -1}
            disabled={item.disabled}
            onClick={() => select(item.id)}
            onKeyDown={(e) => onKey(e, item.id)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
              active === item.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
              item.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {item.label}
            {item.badge}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`panel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          hidden={active !== item.id}
          tabIndex={0}
          className="pt-5 focus-visible:outline-none"
        >
          {active === item.id && item.content}
        </div>
      ))}
    </div>
  );
}
