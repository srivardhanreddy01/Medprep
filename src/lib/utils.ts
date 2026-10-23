import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat("en-US", opts).format(typeof value === "string" ? new Date(value) : value);
}

export function pct(n: number | null | undefined) {
  return n === null || n === undefined || Number.isNaN(n) ? "—" : `${Math.round(n)}%`;
}
