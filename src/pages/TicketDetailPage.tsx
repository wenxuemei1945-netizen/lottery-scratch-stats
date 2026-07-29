import { useState } from "react";
import { canTransitionTicketStatus, TICKET_STATUS_LABELS } from "../domain/ticketStatus";
import type { Ticket, TicketStatus } from "../domain/types";
import { deleteTicket, updateTicket } from "../storage/ticketRepository";

export function TicketDetailPage({
  ticket,
  onSaved,
  onDeleted,
  onBack,
}: {
  ticket: Ticket;
  onSaved: () => Promise<void>;
  onDeleted: () => Promise<void>;
  onBack: () => void;
}) {
  const [prizeAmount, setPrizeAmount] = useState(ticket.prizeAmount ? String(ticket.prizeAmount) : "");
  const [message, setMessage] = useState("");

  async function saveStatus(nextStatus: TicketStatus) {
    if (!canTransitionTicketStatus(ticket.status, nextStatus)) {
      setMessage("当前状态不能变更为该状态");
      return;
    }

    const now = new Date().toISOString();
    const requiresPrize = nextStatus === "won" || nextStatus === "redeemed";
    const amount = requiresPrize ? Number(prizeAmount || 0) : 0;
    setMessage("");

    if (requiresPrize && (!Number.isFinite(amount) || amount < 0)) {
      setMessage("中奖金额必须是有效数字");
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

  async function handleDelete() {
    if (!window.confirm(`确认删除 ${ticket.code}？`)) {
      return;
    }

    await deleteTicket(ticket.id);
    await onDeleted();
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
      {ticket.packName ? (
        <p>
          包号：{ticket.packName}
          {ticket.packIndex ? ` / 第 ${ticket.packIndex} 张` : ""}
        </p>
      ) : null}

      <label className="field">
        <span>中奖金额</span>
        <input
          inputMode="decimal"
          value={prizeAmount}
          onChange={(event) => setPrizeAmount(event.target.value)}
        />
      </label>

      {message ? <p className="message">{message}</p> : null}

      <button className="primary-button" type="button" onClick={() => void saveStatus("lost")}>
        标记未中奖
      </button>
      <button className="primary-button" type="button" onClick={() => void saveStatus("won")}>
        标记中奖
      </button>
      {ticket.status === "won" && (
        <button className="primary-button" type="button" onClick={() => void saveStatus("redeemed")}>
          标记已兑奖
        </button>
      )}
      <button className="danger-outline-button" type="button" onClick={() => void handleDelete()}>
        删除这张票
      </button>
    </section>
  );
}
