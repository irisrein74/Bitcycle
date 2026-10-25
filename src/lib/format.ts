import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatEkp(value: number): string {
  return `${Math.round(value).toLocaleString("es-AR")} EKP`;
}

export function formatKg(value: number): string {
  return `${value.toLocaleString("es-AR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} kg`;
}

export function formatGrams(value: number): string {
  return `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} g`;
}

export function formatDateTime(value: string): string {
  const date = value.includes("T") ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d MMM yyyy · HH:mm", { locale: es });
}

export function formatDate(value: string): string {
  const date = value.includes("T") ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d MMM yyyy", { locale: es });
}

export function clientCode(id: number): string {
  return `#${String(100 + id)}`;
}

export function articleCode(id: number): string {
  return `#${String(500 + id)}`;
}

export function ticketCode(id: number, year = 2026): string {
  return `TK-${year}-${String(id).padStart(4, "0")}`;
}

export function redemptionCode(id: number, year = 2026): string {
  return `CAN-${year}-${String(id).padStart(3, "0")}`;
}

export function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}
