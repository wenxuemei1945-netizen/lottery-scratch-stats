import type { Game, Ticket, TicketStatus } from "./types";

export interface AppBackup {
  version: 1;
  exportedAt: string;
  games: Game[];
  tickets: Ticket[];
}

export function createBackup(games: Game[], tickets: Ticket[], exportedAt = new Date().toISOString()): AppBackup {
  return {
    version: 1,
    exportedAt,
    games: [...games],
    tickets: [...tickets]
  };
}

export function parseBackupJson(json: string): AppBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("\u5907\u4efd\u6587\u4ef6\u4e0d\u662f\u6709\u6548\u7684 JSON");
  }

  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error("\u5907\u4efd\u6587\u4ef6\u7248\u672c\u4e0d\u652f\u6301");
  }

  if (!isAppBackup(parsed)) {
    throw new Error("\u5907\u4efd\u6587\u4ef6\u683c\u5f0f\u65e0\u6548");
  }

  return parsed;
}

function isAppBackup(value: unknown): value is AppBackup {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.exportedAt === "string" &&
    Array.isArray(value.games) &&
    Array.isArray(value.tickets) &&
    value.games.every(isValidGame) &&
    value.tickets.every(isValidTicket)
  );
}

function isValidGame(value: unknown): value is Game {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.name !== "string") return false;
  if (typeof value.price !== "number") return false;
  if (typeof value.active !== "boolean") return false;
  if (typeof value.createdAt !== "string") return false;
  if (typeof value.updatedAt !== "string") return false;

  if (!isOptionalStringField(value.packSize, "number")) return false;
  if (!isOptionalStringField(value.topPrize, "number")) return false;
  if (!isOptionalStringField(value.barcodePrefixPatterns, "array-of-string")) return false;

  return true;
}

function isValidTicket(value: unknown): value is Ticket {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.code !== "string") return false;
  if (typeof value.gameId !== "string") return false;
  if (typeof value.gameName !== "string") return false;
  if (typeof value.price !== "number") return false;
  if (!isTicketStatus(value.status)) return false;
  if (typeof value.prizeAmount !== "number") return false;
  if (typeof value.purchasedAt !== "string") return false;
  if (typeof value.createdAt !== "string") return false;
  if (typeof value.updatedAt !== "string") return false;

  if (!isOptionalStringField(value.scratchedAt, "string")) return false;
  if (!isOptionalStringField(value.redeemedAt, "string")) return false;
  if (!isOptionalStringField(value.note, "string")) return false;

  return true;
}

function isTicketStatus(value: unknown): value is TicketStatus {
  return value === "unopened" || value === "lost" || value === "won" || value === "redeemed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalStringField(value: unknown, type: "string" | "number" | "array-of-string"): value is undefined | string | number | string[] {
  if (value === undefined) return true;

  if (type === "string") {
    return typeof value === "string";
  }

  if (type === "number") {
    return typeof value === "number";
  }

  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
