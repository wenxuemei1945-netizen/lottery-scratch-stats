import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { useLotteryData } from "./hooks/useLotteryData";

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
    expect(screen.queryByText("已记录 0 张彩票")).not.toBeInTheDocument();
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

  it("starts on the home page and navigates to ticket list", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "刮刮乐统计" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "彩票" }));

    expect(screen.getByRole("heading", { name: "彩票列表" })).toBeInTheDocument();
  });
});
