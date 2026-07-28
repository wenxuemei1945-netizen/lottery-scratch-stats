import { describe, expect, it } from "vitest";
import { makeTicket } from "../test/testData";
import { calculateGameStats, calculateOverallStats } from "./stats";

describe("statistics", () => {
  it("counts unopened tickets as investment but excludes them from win-rate denominator", () => {
    const tickets = [
      makeTicket({ id: "1", code: "A", status: "unopened", prizeAmount: 0 }),
      makeTicket({ id: "2", code: "B", status: "lost", prizeAmount: 0 }),
      makeTicket({ id: "3", code: "C", status: "won", prizeAmount: 50 })
    ];

    expect(calculateOverallStats(tickets)).toEqual({
      totalTickets: 3,
      unopenedTickets: 1,
      scratchedTickets: 2,
      winningTickets: 1,
      totalInvestment: 30,
      totalPrize: 50,
      netProfit: 20,
      winRate: 0.5,
      returnRate: 50 / 30
    });
  });

  it("groups statistics by game", () => {
    const tickets = [
      makeTicket({ id: "1", code: "A", gameId: "g1", gameName: "好运十倍", price: 10, status: "won", prizeAmount: 20 }),
      makeTicket({ id: "2", code: "B", gameId: "g2", gameName: "喜相逢", price: 20, status: "lost", prizeAmount: 0 })
    ];

    expect(calculateGameStats(tickets)).toEqual([
      expect.objectContaining({ gameId: "g1", gameName: "好运十倍", totalInvestment: 10, totalPrize: 20, netProfit: 10 }),
      expect.objectContaining({ gameId: "g2", gameName: "喜相逢", totalInvestment: 20, totalPrize: 0, netProfit: -20 })
    ]);
  });
});
