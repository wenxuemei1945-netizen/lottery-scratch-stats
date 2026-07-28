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

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesStatus = status === "all" || ticket.status === status;
        const trimmedQuery = query.trim();
        const matchesQuery =
          trimmedQuery.length === 0 ||
          ticket.code.includes(trimmedQuery) ||
          ticket.gameName.includes(trimmedQuery);

        return matchesStatus && matchesQuery;
      }),
    [query, status, tickets]
  );

  return (
    <section className="page">
      <h1>彩票列表</h1>

      <label className="field">
        <span>状态筛选</span>
        <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
          <option value="all">全部</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>搜索编号或票种</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      <div className="list-stack">
        {filteredTickets.map((ticket) => (
          <button
            key={ticket.id}
            className="ticket-row"
            type="button"
            onClick={() => onOpenTicket(ticket.id)}
          >
            <span>{ticket.code}</span>
            <strong>{ticket.gameName}</strong>
            <small>
              {TICKET_STATUS_LABELS[ticket.status]} / {ticket.prizeAmount} 元
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
