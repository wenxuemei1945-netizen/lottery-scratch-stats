import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBackup } from "../domain/backup";
import { listTickets, resetDatabase } from "../storage/ticketRepository";
import { makeGame, makeTicket } from "../test/testData";
import { BackupPage } from "./BackupPage";

describe("BackupPage", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("imports backup JSON", async () => {
    const backup = createBackup([makeGame()], [makeTicket({ code: "A" })], "2026-07-28T00:00:00.000Z");
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    const onImported = vi.fn();

    render(<BackupPage onImported={onImported} />);

    await userEvent.upload(screen.getByLabelText("导入 JSON 备份"), file);

    await waitFor(async () => {
      expect(await listTickets()).toHaveLength(1);
      expect(onImported).toHaveBeenCalled();
      expect(screen.getByText("导入完成")).toBeInTheDocument();
    });
  });
});
