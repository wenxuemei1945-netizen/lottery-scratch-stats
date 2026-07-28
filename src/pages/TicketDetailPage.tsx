import { useState } from "react";
import { canTransitionTicketStatus, TICKET_STATUS_LABELS } from "../domain/ticketStatus";
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
  const [message, setMessage] = useState("");

  async function saveStatus(nextStatus: TicketStatus) {
    if (!canTransitionTicketStatus(ticket.status, nextStatus)) {
      setMessage("Current status cannot change to that state");
      return;
    }

    const now = new Date().toISOString();
    const requiresPrize = nextStatus === "won" || nextStatus === "redeemed";
    const amount = requiresPrize ? Number(prizeAmount || 0) : 0;
    setMessage("");

    if (requiresPrize && (!Number.isFinite(amount) || amount < 0)) {
      setMessage("Prize amount must be a valid number");
      return;
    }

    await updateTicket({
      ...ticket,
      status: nextStatus,
      prizeAmount: amount,
      scratchedAt: nextStatus === "unopened" ? undefined : ticket.scratchedAt ?? now,
      redeemedAt: nextStatus === "redeemed" ? ticket.redeemedAt ?? now : undefined,
      updatedAt: now,
    });
    await onSaved();
    onBack();
  }

  return (
    <section className="page">
      <button className="ghost-button" type="button" onClick={onBack}>
        Back
      </button>
      <h1>{ticket.gameName}</h1>
      <p>{ticket.code}</p>
      <p>Current status: {TICKET_STATUS_LABELS[ticket.status]}</p>

      <label className="field">
        <span>Prize amount</span>
        <input
          inputMode="decimal"
          value={prizeAmount}
          onChange={(event) => setPrizeAmount(event.target.value)}
        />
      </label>

      {message ? <p className="message">{message}</p> : null}

      <button className="primary-button" type="button" onClick={() => void saveStatus("lost")}>
        Mark Lost
      </button>
      <button className="primary-button" type="button" onClick={() => void saveStatus("won")}>
        Mark Won
      </button>
      {ticket.status === "won" && (
        <button className="primary-button" type="button" onClick={() => void saveStatus("redeemed")}>
          Mark Redeemed
        </button>
      )}
    </section>
  );
}
