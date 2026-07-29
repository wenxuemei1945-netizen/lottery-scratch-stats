import { useMemo, useState } from "react";
import { TICKET_STATUS_LABELS } from "../domain/ticketStatus";
import type { Ticket, TicketStatus } from "../domain/types";
import { deleteTicket } from "../storage/ticketRepository";

type StatusFilter = "all" | TicketStatus;

export function TicketsPage({
  tickets,
  onOpenTicket,
  onChanged,
}: {
  tickets: Ticket[];
  onOpenTicket: (ticketId: string) => void;
  onChanged: () => Promise<void>;
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

  async function handleDelete(ticket: Ticket) {
    if (!window.confirm(`确认删除 ${ticket.code}？`)) {
      return;
    }

    await deleteTicket(ticket.id);
    await onChanged();
  }

  return (
    <section className="page">
      <h1>票据列表</h1>

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
        {filteredTickets.length === 0 ? (
          <p className="empty-state">没有匹配的彩票</p>
        ) : (
          filteredTickets.map((ticket) => (
            <article className="ticket-row" key={ticket.id}>
              <button className="ticket-main-button" type="button" onClick={() => onOpenTicket(ticket.id)}>
                <span>{ticket.code}</span>
                <strong>{ticket.gameName}</strong>
                <small>
                  {ticket.packName ? `${ticket.packName} / ` : ""}
                  {TICKET_STATUS_LABELS[ticket.status]} / {ticket.prizeAmount} 元
                </small>
              </button>
              <button className="danger-button" type="button" onClick={() => void handleDelete(ticket)}>
                删除
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
