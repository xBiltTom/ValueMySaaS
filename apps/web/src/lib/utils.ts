import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEnum(value?: string | null) {
  if (!value) return "Sin definir";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCurrency(value?: number | string | null, currency = "USD") {
  if (value === null || value === undefined || value === "") return "Sin precio";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `${value} ${currency}`;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
}
