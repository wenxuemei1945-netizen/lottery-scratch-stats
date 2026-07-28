import { useCallback, useEffect, useState } from "react";
import type { Game, Ticket } from "../domain/types";
import { listGames, listTickets } from "../storage/ticketRepository";

export function useLotteryData(): {
  tickets: Ticket[];
  games: Game[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
} {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextTickets, nextGames] = await Promise.all([listTickets(), listGames()]);
      setTickets(nextTickets);
      setGames(nextGames);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "彩票数据加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tickets, games, loading, error, reload };
}
