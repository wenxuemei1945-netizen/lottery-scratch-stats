import { beforeEach, describe, expect, it } from "vitest";
import { makeGame, makeTicket } from "../test/testData";
import {
  getTicketByCode,
  deleteTicket,
  listGames,
  listTickets,
  replaceAllData,
  resetDatabase,
  saveGame,
  saveTicket
} from "./ticketRepository";

describe("ticket repository", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("saves and lists games", async () => {
    await saveGame(makeGame({ id: "game-1", name: "婵傚€熺箥閸椾礁鈧?" }));

    expect(await listGames()).toEqual([expect.objectContaining({ id: "game-1", name: "婵傚€熺箥閸椾礁鈧?" })]);
  });

  it("saves tickets and finds them by code", async () => {
    const ticket = makeTicket({ id: "ticket-1", code: "J0353-26082-0564563-133-3" });

    await saveTicket(ticket);

    expect(await listTickets()).toHaveLength(1);
    expect(await getTicketByCode("J0353-26082-0564563-133-3")).toEqual(ticket);
  });

  it("rejects duplicate ticket codes", async () => {
    await saveTicket(makeTicket({ id: "ticket-1", code: "A" }));

    await expect(saveTicket(makeTicket({ id: "ticket-2", code: "A" }))).rejects.toThrow("彩票编号已存在");
  });

  it("deletes a ticket by id", async () => {
    await saveTicket(makeTicket({ id: "ticket-1", code: "A" }));

    await deleteTicket("ticket-1");

    expect(await getTicketByCode("A")).toBeUndefined();
    expect(await listTickets()).toEqual([]);
  });

  it("keeps existing data when replaceAllData fails", async () => {
    const existingGame = makeGame({ id: "existing-game", name: "Existing" });
    const existingTicket = makeTicket({ id: "existing-ticket", code: "EXISTING" });
    await saveGame(existingGame);
    await saveTicket(existingTicket);

    const nextGame = makeGame({ id: "next-game", name: "Next" });
    const duplicateTicketCode = "DUPLICATE-CODE";

    await expect(
      replaceAllData(
        [nextGame],
        [
          makeTicket({ id: "next-ticket-1", code: duplicateTicketCode }),
          makeTicket({ id: "next-ticket-2", code: duplicateTicketCode })
        ]
      )
    ).rejects.toThrow();

    expect(await listGames()).toEqual([existingGame]);
    expect(await listTickets()).toEqual([existingTicket]);
  });
});
