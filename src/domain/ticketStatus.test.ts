import { describe, expect, it } from "vitest";
import { canTransitionTicketStatus, isScratchedStatus, TICKET_STATUS_LABELS } from "./ticketStatus";

describe("ticket status rules", () => {
  it("labels all ticket states in Chinese", () => {
    expect(TICKET_STATUS_LABELS).toEqual({
      unopened: "未刮开",
      lost: "已刮未中奖",
      won: "已中奖",
      redeemed: "已兑奖"
    });
  });

  it("allows the intended status transitions", () => {
    expect(canTransitionTicketStatus("unopened", "lost")).toBe(true);
    expect(canTransitionTicketStatus("unopened", "won")).toBe(true);
    expect(canTransitionTicketStatus("won", "redeemed")).toBe(true);
  });

  it("treats unchanged states as allowed corrections", () => {
    expect(canTransitionTicketStatus("lost", "lost")).toBe(true);
  });

  it("blocks invalid direct transitions", () => {
    expect(canTransitionTicketStatus("lost", "redeemed")).toBe(false);
    expect(canTransitionTicketStatus("redeemed", "unopened")).toBe(false);
  });

  it("knows which states are scratched", () => {
    expect(isScratchedStatus("unopened")).toBe(false);
    expect(isScratchedStatus("lost")).toBe(true);
    expect(isScratchedStatus("won")).toBe(true);
    expect(isScratchedStatus("redeemed")).toBe(true);
  });
});
