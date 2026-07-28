import { useState } from "react";
import { TICKET_STATUS_LABELS } from "../domain/ticketStatus";
import type { Ticket, TicketStatus } from "../domain/types";
import { updateTicket } from "../storage/ticketRepository";

export function TicketDetailPage({
  ticket,
  onSaved,
  onBack,
}: {
  ticket: Ticket;
  onSaved: () => Promise<void>;
  onBack: () => void;
}) {
  const [prizeAmount, setPrizeAmount] = useState(ticket.prizeAmount ? String(ticket.prizeAmount) : "");

  async function saveStatus(status: TicketStatus, amount: number) {
    const now = new Date().toISOString();

    await updateTicket({
      ...ticket,
      status,
      prizeAmount: amount,
      scratchedAt: status === "unopened" ? undefined : ticket.scratchedAt ?? now,
      redeemedAt: status === "redeemed" ? now : ticket.redeemedAt,
      updatedAt: now,
    });

    await onSaved();
    onBack();
  }

  return (
    <section className="page">
      <button className="ghost-button" type="button" onClick={onBack}>
        返回
      </button>
      <h1>{ticket.gameName}</h1>
      <p>{ticket.code}</p>
      <p>当前状态：{TICKET_STATUS_LABELS[ticket.status]}</p>

      <label className="field">
        <span>中奖金额</span>
        <input
          inputMode="decimal"
          value={prizeAmount}
          onChange={(event) => setPrizeAmount(event.target.value)}
        />
      </label>

      <button className="primary-button" type="button" onClick={() => saveStatus("lost", 0)}>
        标记未中奖
      </button>
      <button
        className="primary-button"
        type="button"
        onClick={() => saveStatus("won", Number(prizeAmount || 0))}
      >
        标记中奖
      </button>
      {ticket.status === "won" && (
        <button
          className="primary-button"
          type="button"
          onClick={() => saveStatus("redeemed", ticket.prizeAmount)}
        >
          标记已兑奖
        </button>
      )}
    </section>
  );
}
