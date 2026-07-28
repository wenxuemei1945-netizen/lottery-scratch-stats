import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Game, Ticket } from "../domain/types";

interface LotteryDb extends DBSchema {
  tickets: {
    key: string;
    value: Ticket;
    indexes: {
      "by-code": string;
      "by-game": string;
      "by-status": string;
    };
  };
  games: {
    key: string;
    value: Game;
    indexes: {
      "by-name": string;
    };
  };
}

const DB_NAME = "lottery-scratch-stats";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LotteryDb>> | undefined;

export function getDatabase() {
  dbPromise ??= openDB<LotteryDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const ticketStore = db.createObjectStore("tickets", { keyPath: "id" });
      ticketStore.createIndex("by-code", "code", { unique: true });
      ticketStore.createIndex("by-game", "gameId");
      ticketStore.createIndex("by-status", "status");

      const gameStore = db.createObjectStore("games", { keyPath: "id" });
      gameStore.createIndex("by-name", "name", { unique: false });
    }
  });

  return dbPromise;
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await Promise.all([db.clear("tickets"), db.clear("games")]);
}
