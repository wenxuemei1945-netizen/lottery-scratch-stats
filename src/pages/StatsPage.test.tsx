import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeTicket } from "../test/testData";
import { StatsPage } from "./StatsPage";

describe("StatsPage", () => {
  it("shows per-game statistics", () => {
    render(
      <StatsPage
        tickets={[
          makeTicket({ id: "1", code: "A", gameId: "g1", gameName: "好运十倍", price: 10, status: "won", prizeAmount: 20 }),
          makeTicket({ id: "2", code: "B", gameId: "g2", gameName: "喜相逢", price: 20, status: "lost", prizeAmount: 0 }),
        ]}
      />
    );

    expect(screen.getByText("好运十倍")).toBeInTheDocument();
    expect(screen.getByText("+10 元")).toBeInTheDocument();
    expect(screen.getByText("喜相逢")).toBeInTheDocument();
    expect(screen.getByText("-20 元")).toBeInTheDocument();
  });

  it("shows per-pack profit and loss", () => {
    render(
      <StatsPage
        tickets={[
          makeTicket({
            id: "1",
            code: "A",
            gameName: "好运十倍",
            price: 10,
            packId: "pack-a",
            packName: "好运十倍-001",
            packIndex: 1,
            packSize: 50,
            status: "won",
            prizeAmount: 20,
          }),
          makeTicket({
            id: "2",
            code: "B",
            gameName: "好运十倍",
            price: 10,
            packId: "pack-a",
            packName: "好运十倍-001",
            packIndex: 2,
            packSize: 50,
            status: "lost",
            prizeAmount: 0,
          }),
        ]}
      />
    );

    expect(screen.getByText("按包统计")).toBeInTheDocument();
    expect(screen.getByText("好运十倍-001")).toBeInTheDocument();
    expect(screen.getByText("好运十倍 / 2/50 张")).toBeInTheDocument();
    expect(screen.getByText("投入 20 元 / 中奖 20 元")).toBeInTheDocument();
  });
});
