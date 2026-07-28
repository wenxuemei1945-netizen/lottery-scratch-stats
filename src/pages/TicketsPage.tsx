import { useMemo, useState } from "react";
import { TICKET_STATUS_LABELS } from "../domain/ticketStatus";
import type { Ticket, TicketStatus } from "../domain/types";

type StatusFilter = "all" | TicketStatus;

export function TicketsPage({
  tickets,
  onOpenTicket,
}: {
  tickets: Ticket[];
  onOpenTicket: (ticketId: string) => void;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const filteredTickets = useMemo(() => {
    const trimmedQuery = query.trim();

    return tickets.filter((ticket) => {
      const matchesStatus = status === "all" || ticket.status === status;
      const matchesQuery =
        trimmedQuery.length === 0 ||
        ticket.code.includes(trimmedQuery) ||
        ticket.gameName.includes(trimmedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, status, tickets]);

  return (
    <section className="page">
      <h1>Ticket list</h1>

      <label className="field">
        <span>Status filter</span>
        <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
          <option value="all">All</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Search code or game</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      <div className="list-stack">
        {filteredTickets.length === 0 ? (
          <p className="empty-state">No matching tickets</p>
        ) : (
          filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              className="ticket-row"
              type="button"
              onClick={() => onOpenTicket(ticket.id)}
            >
              <span>{ticket.code}</span>
              <strong>{ticket.gameName}</strong>
              <small>
                {TICKET_STATUS_LABELS[ticket.status]} / {ticket.prizeAmount} yuan
              </small>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
