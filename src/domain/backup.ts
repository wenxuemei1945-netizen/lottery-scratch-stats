import type { Game, Ticket } from "./types";

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
    games,
    tickets
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

  if (!Array.isArray(parsed.games) || !Array.isArray(parsed.tickets) || typeof parsed.exportedAt !== "string") {
    throw new Error("\u5907\u4efd\u6587\u4ef6\u683c\u5f0f\u65e0\u6548");
  }

  return parsed as AppBackup;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
