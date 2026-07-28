import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTicketByCode, resetDatabase, saveTicket } from "../storage/ticketRepository";
import { makeTicket } from "../test/testData";
import { TicketDetailPage } from "./TicketDetailPage";

describe("TicketDetailPage", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("marks a ticket as won with prize amount", async () => {
    const ticket = makeTicket({ id: "1", code: "A", status: "unopened", prizeAmount: 0 });
    await saveTicket(ticket);

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onBack={vi.fn()} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Prize amount"), "50");
    await user.click(screen.getByRole("button", { name: "Mark Won" }));

    expect(await getTicketByCode("A")).toEqual(
      expect.objectContaining({ status: "won", prizeAmount: 50 })
    );
  });

  it("shows a message and blocks invalid transitions", async () => {
    const ticket = makeTicket({ id: "1", code: "A", status: "lost", prizeAmount: 0 });
    await saveTicket(ticket);

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onBack={vi.fn()} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Prize amount"), "60");
    await user.click(screen.getByRole("button", { name: "Mark Won" }));

    expect(await getTicketByCode("A")).toEqual(
      expect.objectContaining({ status: "lost", prizeAmount: 0 })
    );
    expect(screen.getByText("Current status cannot change to that state")).toBeInTheDocument();
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

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onBack={vi.fn()} />);

    const user = userEvent.setup();
    const input = screen.getByLabelText("Prize amount");
    await user.clear(input);
    await user.type(input, "50");
    await user.click(screen.getByRole("button", { name: "Mark Redeemed" }));

    expect(await getTicketByCode("A")).toEqual(
      expect.objectContaining({
        status: "redeemed",
        prizeAmount: 50,
        scratchedAt: "2026-07-28T00:00:00.000Z",
        redeemedAt: expect.any(String),
      })
    );
  });
});
