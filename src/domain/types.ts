export type TicketStatus = "unopened" | "lost" | "won" | "redeemed";

export interface Ticket {
  id: string;
  code: string;
  gameId: string;
  gameName: string;
  price: number;
  status: TicketStatus;
  prizeAmount: number;
  purchasedAt: string;
  scratchedAt?: string;
  redeemedAt?: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface Game {
  id: string;
  name: string;
  price: number;
  packSize?: number;
  topPrize?: number;
  barcodePrefixPatterns?: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
