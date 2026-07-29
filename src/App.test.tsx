import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { useLotteryData } from "./hooks/useLotteryData";
import { makeTicket } from "./test/testData";

vi.mock("./hooks/useLotteryData", () => ({
  useLotteryData: vi.fn(),
}));

const useLotteryDataMock = vi.mocked(useLotteryData);

describe("App navigation", () => {
  beforeEach(() => {
    useLotteryDataMock.mockReturnValue({
      tickets: [],
      games: [],
      loading: false,
      error: null,
      reload: vi.fn(),
    });
  });

  it("shows a loading state before data is ready", () => {
    useLotteryDataMock.mockReturnValueOnce({
      tickets: [],
      games: [],
      loading: true,
      error: null,
      reload: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("正在加载彩票数据");
    expect(screen.queryByText("彩票列表")).not.toBeInTheDocument();
  });

  it("shows an error state when loading fails", () => {
    useLotteryDataMock.mockReturnValueOnce({
      tickets: [],
      games: [],
      loading: false,
      error: "IndexedDB unavailable",
      reload: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("alert")).toHaveTextContent("IndexedDB unavailable");
    expect(screen.getByRole("button", { name: "重试" })).toBeEnabled();
  });

  it("starts on the home page and navigates to manual entry", async () => {
    render(<App />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "入库" }));

    expect(screen.getByRole("heading", { name: "手动入库" })).toBeInTheDocument();
  });

  it("starts on the home page and navigates to ticket list", async () => {
    render(<App />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "票据" }));

    expect(screen.getByRole("heading", { name: "票据列表" })).toBeInTheDocument();
  });

  it("lets the bottom nav switch away from ticket detail", async () => {
    useLotteryDataMock.mockReturnValue({
      tickets: [makeTicket({ id: "ticket-1", code: "A", gameName: "Good Luck", status: "unopened" })],
      games: [],
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<App />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "票据" }));
    await user.click(screen.getByRole("button", { name: /A/ }));

    expect(screen.getByRole("heading", { name: "Good Luck" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "票据" }));

    expect(screen.getByRole("heading", { name: "票据列表" })).toBeInTheDocument();
  });
});
