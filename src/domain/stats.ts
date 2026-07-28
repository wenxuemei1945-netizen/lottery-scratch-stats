import { isScratchedStatus } from "./ticketStatus";
import type { Ticket } from "./types";

export interface OverallStats {
  totalTickets: number;
  unopenedTickets: number;
  scratchedTickets: number;
  winningTickets: number;
  totalInvestment: number;
  totalPrize: number;
  netProfit: number;
  winRate: number;
  returnRate: number;
}

export interface GameStats extends OverallStats {
  gameId: string;
  gameName: string;
}

export function calculateOverallStats(tickets: Ticket[]): OverallStats {
  const totalTickets = tickets.length;
  const unopenedTickets = tickets.filter((ticket) => ticket.status === "unopened").length;
  const scratchedTickets = tickets.filter((ticket) => isScratchedStatus(ticket.status)).length;
  const winningTickets = tickets.filter((ticket) => ticket.status === "won" || ticket.status === "redeemed").length;
  const totalInvestment = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
  const totalPrize = tickets.reduce((sum, ticket) => sum + ticket.prizeAmount, 0);
  const netProfit = totalPrize - totalInvestment;

  return {
    totalTickets,
    unopenedTickets,
    scratchedTickets,
    winningTickets,
    totalInvestment,
    totalPrize,
    netProfit,
    winRate: scratchedTickets === 0 ? 0 : winningTickets / scratchedTickets,
    returnRate: totalInvestment === 0 ? 0 : totalPrize / totalInvestment
  };
}

export function calculateGameStats(tickets: Ticket[]): GameStats[] {
  const grouped = new Map<string, Ticket[]>();

  for (const ticket of tickets) {
    const existing = grouped.get(ticket.gameId) ?? [];
    existing.push(ticket);
    grouped.set(ticket.gameId, existing);
  }

  return [...grouped.entries()].map(([gameId, gameTickets]) => ({
    gameId,
    gameName: gameTickets[0]?.gameName ?? "",
    ...calculateOverallStats(gameTickets)
  }));
}
