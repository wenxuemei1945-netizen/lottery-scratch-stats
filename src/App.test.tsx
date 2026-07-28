import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "./storage/ticketRepository";
import { App } from "./App";

describe("App navigation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("starts on the home page and navigates to ticket list", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "刮刮乐统计" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "彩票" }));

    expect(screen.getByRole("heading", { name: "彩票列表" })).toBeInTheDocument();
  });
});
