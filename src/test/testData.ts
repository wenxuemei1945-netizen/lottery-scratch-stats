import type { Game, Ticket, TicketStatus } from "../domain/types";

export function makeGame(overrides: Partial<Game> = {}): Game {
  const now = "2026-07-28T00:00:00.000Z";
  return {
    id: "game-1",
    name: "好运十倍",
    price: 10,
    topPrize: 400000,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  const now = "2026-07-28T00:00:00.000Z";
  const status: TicketStatus = overrides.status ?? "unopened";
  return {
    id: "ticket-1",
    code: "J0353-26082-0564563-133-3",
    gameId: "game-1",
    gameName: "好运十倍",
    price: 10,
    status,
    prizeAmount: status === "won" || status === "redeemed" ? 20 : 0,
    purchasedAt: "2026-07-28",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}
