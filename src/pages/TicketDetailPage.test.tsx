import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTicketByCode, resetDatabase, saveTicket } from "../storage/ticketRepository";
import { makeTicket } from "../test/testData";
import { TicketDetailPage } from "./TicketDetailPage";

describe("TicketDetailPage", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
  });

  it("marks a ticket as won with prize amount", async () => {
    const ticket = makeTicket({ id: "1", code: "A", status: "unopened", prizeAmount: 0 });
    await saveTicket(ticket);

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onDeleted={vi.fn()} onBack={vi.fn()} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("中奖金额"), "50");
    await user.click(screen.getByRole("button", { name: "标记中奖" }));

    expect(await getTicketByCode("A")).toEqual(
      expect.objectContaining({ status: "won", prizeAmount: 50 })
    );
  });

  it("rejects non-numeric prize amounts", async () => {
    const ticket = makeTicket({ id: "1", code: "A", status: "unopened", prizeAmount: 0 });
    await saveTicket(ticket);

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onDeleted={vi.fn()} onBack={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("中奖金额"), "abc");
    await userEvent.click(screen.getByRole("button", { name: "标记中奖" }));

    expect(await getTicketByCode("A")).toEqual(
      expect.objectContaining({ status: "unopened", prizeAmount: 0 })
    );
    expect(screen.getByText("中奖金额必须是有效数字")).toBeInTheDocument();
  });

  it("shows a message and blocks invalid transitions", async () => {
    const ticket = makeTicket({ id: "1", code: "A", status: "lost", prizeAmount: 0 });
    await saveTicket(ticket);

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onDeleted={vi.fn()} onBack={vi.fn()} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("中奖金额"), "60");
    await user.click(screen.getByRole("button", { name: "标记中奖" }));

    expect(await getTicketByCode("A")).toEqual(
      expect.objectContaining({ status: "lost", prizeAmount: 0 })
    );
    expect(screen.getByText("当前状态不能变更为该状态")).toBeInTheDocument();
  });

  it("redeems using the current prize input value", async () => {
    const ticket = makeTicket({
      id: "1",
      code: "A",
      status: "won",
      prizeAmount: 10,
      scratchedAt: "2026-07-28T00:00:00.000Z",
      redeemedAt: undefined,
    });
    await saveTicket(ticket);

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onDeleted={vi.fn()} onBack={vi.fn()} />);

    const user = userEvent.setup();
    const input = screen.getByLabelText("中奖金额");
    await user.clear(input);
    await user.type(input, "50");
    await user.click(screen.getByRole("button", { name: "标记已兑奖" }));

    expect(await getTicketByCode("A")).toEqual(
      expect.objectContaining({
        status: "redeemed",
        prizeAmount: 50,
        scratchedAt: "2026-07-28T00:00:00.000Z",
        redeemedAt: expect.any(String),
      })
    );
  });

  it("deletes the current ticket after confirmation", async () => {
    const ticket = makeTicket({ id: "1", code: "A" });
    await saveTicket(ticket);
    const onDeleted = vi.fn();
    const onBack = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onDeleted={onDeleted} onBack={onBack} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "删除这张票" }));

    expect(await getTicketByCode("A")).toBeUndefined();
    expect(onDeleted).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });
});
