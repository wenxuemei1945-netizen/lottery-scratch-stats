import type { Game, Ticket } from "../domain/types";
import { getDatabase, resetDatabase as clearDatabase } from "./db";

export async function resetDatabase(): Promise<void> {
  await clearDatabase();
}

export async function listTickets(): Promise<Ticket[]> {
  const db = await getDatabase();
  return db.getAll("tickets");
}

export async function saveTicket(ticket: Ticket): Promise<Ticket> {
  const existing = await getTicketByCode(ticket.code);

  if (existing && existing.id !== ticket.id) {
    throw new Error("彩票编号已存在");
  }

  const db = await getDatabase();
  await db.put("tickets", ticket);
  return ticket;
}

export async function updateTicket(ticket: Ticket): Promise<Ticket> {
  const existing = await getTicketByCode(ticket.code);

  if (existing && existing.id !== ticket.id) {
    throw new Error("彩票编号已存在");
  }

  const db = await getDatabase();
  await db.put("tickets", ticket);
  return ticket;
}

export async function getTicketById(id: string): Promise<Ticket | undefined> {
  const db = await getDatabase();
  return db.get("tickets", id);
}

export async function getTicketByCode(code: string): Promise<Ticket | undefined> {
  const db = await getDatabase();
  return db.getFromIndex("tickets", "by-code", code);
}

export async function listGames(): Promise<Game[]> {
  const db = await getDatabase();
  return db.getAll("games");
}

export async function saveGame(game: Game): Promise<Game> {
  const db = await getDatabase();
  await db.put("games", game);
  return game;
}

export async function replaceAllData(games: Game[], tickets: Ticket[]): Promise<void> {
  ensureUniqueTicketCodes(tickets);

  const db = await getDatabase();
  const transaction = db.transaction(["games", "tickets"], "readwrite");
  const gamesStore = transaction.objectStore("games");
  const ticketsStore = transaction.objectStore("tickets");

  try {
    await gamesStore.clear();
    await ticketsStore.clear();

    for (const game of games) {
      await gamesStore.put(game);
    }

    for (const ticket of tickets) {
      await ticketsStore.put(ticket);
    }

    await transaction.done;
  } catch (error) {
    await transaction.done.catch(() => undefined);
    throw error;
  }
}

function ensureUniqueTicketCodes(tickets: Ticket[]): void {
  const seenCodes = new Set<string>();

  for (const ticket of tickets) {
    if (seenCodes.has(ticket.code)) {
      throw new Error("彩票编号已存在");
    }

    seenCodes.add(ticket.code);
  }
}
