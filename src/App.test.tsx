import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the initial shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "刮刮乐统计" })).toBeInTheDocument();
    expect(screen.getByText("PWA 初始化完成")).toBeInTheDocument();
  });
});
