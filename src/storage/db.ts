import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Game, Ticket } from "../domain/types";

interface LotteryDb extends DBSchema {
  tickets: {
    key: string;
    value: Ticket;
    indexes: {
      "by-code": string;
      "by-game": string;
      "by-pack": string;
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
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<LotteryDb>> | undefined;

export function getDatabase() {
  dbPromise ??= openDB<LotteryDb>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      const ticketStore =
        oldVersion < 1 ? db.createObjectStore("tickets", { keyPath: "id" }) : transaction.objectStore("tickets");

      if (!ticketStore.indexNames.contains("by-code")) {
        ticketStore.createIndex("by-code", "code", { unique: true });
      }

      if (!ticketStore.indexNames.contains("by-game")) {
        ticketStore.createIndex("by-game", "gameId");
      }

      if (!ticketStore.indexNames.contains("by-pack")) {
        ticketStore.createIndex("by-pack", "packId");
      }

      if (!ticketStore.indexNames.contains("by-status")) {
        ticketStore.createIndex("by-status", "status");
      }

      const gameStore =
        oldVersion < 1 ? db.createObjectStore("games", { keyPath: "id" }) : transaction.objectStore("games");

      if (!gameStore.indexNames.contains("by-name")) {
        gameStore.createIndex("by-name", "name", { unique: false });
      }
    }
  });

  return dbPromise;
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await Promise.all([db.clear("tickets"), db.clear("games")]);
}
