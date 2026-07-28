import type { TicketStatus } from "./types";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  unopened: "未刮开",
  lost: "已刮未中奖",
  won: "已中奖",
  redeemed: "已兑奖"
};

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  unopened: ["unopened", "lost", "won"],
  lost: ["lost"],
  won: ["won", "redeemed"],
  redeemed: ["redeemed"]
};

export function canTransitionTicketStatus(from: TicketStatus, to: TicketStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function isScratchedStatus(status: TicketStatus): boolean {
  return status !== "unopened";
}
