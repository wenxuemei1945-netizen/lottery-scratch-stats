import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    expect(screen.getAllByText("好运十倍").length).toBeGreaterThan(0);
    expect(screen.getByText("+10 元")).toBeInTheDocument();
    expect(screen.getAllByText("喜相逢").length).toBeGreaterThan(0);
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

  it("filters statistics by selected ticket type and shows scratch details", async () => {
    render(
      <StatsPage
        tickets={[
          makeTicket({
            id: "1",
            code: "A",
            gameId: "good-luck",
            gameName: "好运十倍",
            price: 10,
            status: "unopened",
            prizeAmount: 0,
            packId: "good-pack",
            packName: "好运十倍-001",
          }),
          makeTicket({
            id: "2",
            code: "B",
            gameId: "good-luck",
            gameName: "好运十倍",
            price: 10,
            status: "won",
            prizeAmount: 50,
            packId: "good-pack",
            packName: "好运十倍-001",
          }),
          makeTicket({
            id: "3",
            code: "C",
            gameId: "happy",
            gameName: "喜相逢",
            price: 20,
            status: "lost",
            prizeAmount: 0,
            packId: "happy-pack",
            packName: "喜相逢-001",
            packSize: 25,
          }),
        ]}
      />
    );

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("选择票种"), "good-luck");

    const detail = screen.getByLabelText("票种明细");
    expect(within(detail).getByRole("heading", { name: "好运十倍" })).toBeInTheDocument();
    expect(within(detail).getByText("总数 2 张 / 已刮 1 张 / 未刮 1 张")).toBeInTheDocument();
    expect(within(detail).getByText("中奖 1 张 / 中奖金额 50 元")).toBeInTheDocument();
    expect(within(detail).getByText("投入 20 元 / 盈亏 +30 元")).toBeInTheDocument();
    expect(screen.getByText("好运十倍-001")).toBeInTheDocument();
    expect(screen.queryByText("喜相逢-001")).not.toBeInTheDocument();
  });
});
