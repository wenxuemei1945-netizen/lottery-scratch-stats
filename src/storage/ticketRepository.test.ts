import { beforeEach, describe, expect, it } from "vitest";
import { makeGame, makeTicket } from "../test/testData";
import { getTicketByCode, listGames, listTickets, resetDatabase, saveGame, saveTicket } from "./ticketRepository";

describe("ticket repository", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("saves and lists games", async () => {
    await saveGame(makeGame({ id: "game-1", name: "濂借繍鍗佸€?" }));

    expect(await listGames()).toEqual([expect.objectContaining({ id: "game-1", name: "濂借繍鍗佸€?" })]);
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
});
