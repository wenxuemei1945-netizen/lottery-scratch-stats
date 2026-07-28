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
    await user.type(screen.getByLabelText("中奖金额"), "50");
    await user.click(screen.getByRole("button", { name: "标记中奖" }));

    expect(await getTicketByCode("A")).toEqual(
      expect.objectContaining({ status: "won", prizeAmount: 50 })
    );
  });
});
