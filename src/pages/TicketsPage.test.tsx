import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeTicket } from "../test/testData";
import { TicketsPage } from "./TicketsPage";

describe("TicketsPage", () => {
  it("filters unopened tickets and opens a record", async () => {
    const onOpenTicket = vi.fn();

    render(
      <TicketsPage
        tickets={[
          makeTicket({ id: "1", code: "A", status: "unopened" }),
          makeTicket({ id: "2", code: "B", status: "lost" }),
        ]}
        onOpenTicket={onOpenTicket}
      />
    );

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("状态筛选"), "unopened");

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("B")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /A/ }));

    expect(onOpenTicket).toHaveBeenCalledWith("1");
  });
});
