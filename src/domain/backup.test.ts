import { describe, expect, it } from "vitest";
import { makeGame, makeTicket } from "../test/testData";
import { createBackup, parseBackupJson } from "./backup";

describe("backup helpers", () => {
  it("creates versioned backups", () => {
    const backup = createBackup([makeGame()], [makeTicket()], "2026-07-28T00:00:00.000Z");

    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBe("2026-07-28T00:00:00.000Z");
    expect(backup.games).toHaveLength(1);
    expect(backup.tickets).toHaveLength(1);
  });

  it("parses valid backup JSON", () => {
    const backup = createBackup([makeGame()], [makeTicket()], "2026-07-28T00:00:00.000Z");

    expect(parseBackupJson(JSON.stringify(backup))).toEqual(backup);
  });

  it("rejects invalid backup JSON", () => {
    expect(() => parseBackupJson("{bad json")).toThrow("\u5907\u4efd\u6587\u4ef6\u4e0d\u662f\u6709\u6548\u7684 JSON");
    expect(() => parseBackupJson(JSON.stringify({ version: 2, games: [], tickets: [] }))).toThrow("\u5907\u4efd\u6587\u4ef6\u7248\u672c\u4e0d\u652f\u6301");
    expect(() => parseBackupJson(JSON.stringify({ version: 1, games: {}, tickets: [] }))).toThrow("\u5907\u4efd\u6587\u4ef6\u683c\u5f0f\u65e0\u6548");
  });
});
