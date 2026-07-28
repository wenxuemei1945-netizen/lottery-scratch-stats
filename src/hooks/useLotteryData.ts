import { useCallback, useEffect, useState } from "react";
import type { Game, Ticket } from "../domain/types";
import { listGames, listTickets } from "../storage/ticketRepository";

export function useLotteryData(): {
  tickets: Ticket[];
  games: Game[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [nextTickets, nextGames] = await Promise.all([listTickets(), listGames()]);
    setTickets(nextTickets);
    setGames(nextGames);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tickets, games, loading, reload };
}
