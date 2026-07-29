import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBackup } from "../domain/backup";
import { listTickets, resetDatabase, saveGame, saveTicket } from "../storage/ticketRepository";
import { makeGame, makeTicket } from "../test/testData";
import { BackupPage } from "./BackupPage";

let originalURL: typeof globalThis.URL | undefined;

describe("BackupPage", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();

    if (originalURL) {
      Object.defineProperty(globalThis, "URL", {
        configurable: true,
        value: originalURL
      });
      Object.defineProperty(window, "URL", {
        configurable: true,
        value: originalURL
      });
      originalURL = undefined;
    }

    vi.restoreAllMocks();
  });

  it("imports backup JSON", async () => {
    const backup = createBackup([makeGame()], [makeTicket({ code: "A" })], "2026-07-28T00:00:00.000Z");
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    const onImported = vi.fn();

    render(<BackupPage onImported={onImported} />);

    await userEvent.upload(screen.getByLabelText("导入备份文件"), file);

    await waitFor(async () => {
      expect(await listTickets()).toHaveLength(1);
      expect(onImported).toHaveBeenCalled();
      expect(screen.getByText("导入完成")).toBeInTheDocument();
    });
  });

  it("shows an error when backup JSON is invalid", async () => {
    const file = new File(["not json"], "backup.json", { type: "application/json" });
    const onImported = vi.fn();

    render(<BackupPage onImported={onImported} />);

    await userEvent.upload(screen.getByLabelText("导入备份文件"), file);

    await waitFor(() => {
      expect(screen.getByText("导入失败：备份文件不是有效的数据文件")).toBeInTheDocument();
    });
    expect(onImported).not.toHaveBeenCalled();
  });

  it("keeps existing data and shows an error when restore fails", async () => {
    await saveGame(makeGame({ id: "existing-game" }));
    await saveTicket(makeTicket({ id: "existing-ticket", code: "EXISTING" }));

    const backup = createBackup(
      [makeGame({ id: "next-game", name: "Next" })],
      [
        makeTicket({ id: "next-ticket-1", code: "DUPLICATE-CODE" }),
        makeTicket({ id: "next-ticket-2", code: "DUPLICATE-CODE" })
      ],
      "2026-07-28T00:00:00.000Z"
    );
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    const onImported = vi.fn();

    render(<BackupPage onImported={onImported} />);

    await userEvent.upload(screen.getByLabelText("导入备份文件"), file);

    await waitFor(async () => {
      expect(await listTickets()).toHaveLength(1);
      expect(screen.getByText("导入失败：彩票编号已存在")).toBeInTheDocument();
    });
    expect(onImported).not.toHaveBeenCalled();
  });

  it("defers blob URL revocation after export", async () => {
    const createObjectURLSpy = vi.fn().mockReturnValue("blob:backup");
    const revokeObjectURLSpy = vi.fn();
    originalURL = globalThis.URL;
    const urlStub = {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy
    };
    Object.defineProperty(globalThis, "URL", {
      configurable: true,
      value: urlStub
    });
    Object.defineProperty(window, "URL", {
      configurable: true,
      value: urlStub
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<BackupPage onImported={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "导出备份文件" }));

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
  });
});
