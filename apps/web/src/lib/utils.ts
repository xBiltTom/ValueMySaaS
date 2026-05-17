import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnum,
  formatNullable,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
