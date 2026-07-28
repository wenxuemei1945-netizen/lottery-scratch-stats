import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeTicket } from "../test/testData";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows key summary numbers", () => {
    render(
      <HomePage
        tickets={[
          makeTicket({ id: "1", code: "A", status: "unopened", prizeAmount: 0 }),
          makeTicket({ id: "2", code: "B", status: "won", prizeAmount: 50 }),
        ]}
      />
    );

    expect(screen.getByText("总投入")).toBeInTheDocument();
    expect(screen.getByText("20 元")).toBeInTheDocument();
    expect(screen.getByText("净盈亏")).toBeInTheDocument();
    expect(screen.getByText("+30 元")).toBeInTheDocument();
    expect(screen.getByText("未刮 1 张")).toBeInTheDocument();
  });
});
