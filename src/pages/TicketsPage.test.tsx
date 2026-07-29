import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTicketByCode, resetDatabase, saveTicket } from "../storage/ticketRepository";
import { makeTicket } from "../test/testData";
import { TicketsPage } from "./TicketsPage";

describe("TicketsPage", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
  });

  it("filters unopened tickets and opens a record", async () => {
    const onOpenTicket = vi.fn();

    render(
      <TicketsPage
        tickets={[
          makeTicket({ id: "1", code: "A", status: "unopened" }),
          makeTicket({ id: "2", code: "B", status: "lost" }),
        ]}
        onOpenTicket={onOpenTicket}
        onChanged={vi.fn()}
      />
    );

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("状态筛选"), "unopened");

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("B")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /A/ }));

    expect(onOpenTicket).toHaveBeenCalledWith("1");
  });

  it("shows an empty state when no tickets match the filters", async () => {
    render(
      <TicketsPage
        tickets={[makeTicket({ id: "1", code: "A", status: "lost" })]}
        onOpenTicket={vi.fn()}
        onChanged={vi.fn()}
      />
    );

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("状态筛选"), "unopened");

    expect(screen.getByText("没有匹配的彩票")).toBeInTheDocument();
  });

  it("deletes an incorrect ticket after confirmation", async () => {
    const ticket = makeTicket({ id: "1", code: "A" });
    await saveTicket(ticket);
    const onChanged = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<TicketsPage tickets={[ticket]} onOpenTicket={vi.fn()} onChanged={onChanged} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "删除" }));

    expect(await getTicketByCode("A")).toBeUndefined();
    expect(onChanged).toHaveBeenCalled();
  });
});
