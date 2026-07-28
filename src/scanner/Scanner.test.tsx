import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Scanner } from "./Scanner";

const renderMock = vi.fn();
const clearMock = vi.fn();

vi.mock("html5-qrcode", () => ({
  Html5QrcodeScanner: vi.fn(),
}));

describe("Scanner", () => {
  beforeEach(() => {
    vi.mocked(Html5QrcodeScanner).mockReset();
    renderMock.mockReset();
    clearMock.mockReset();
  });

  it("shows a fallback message when scanner startup fails", () => {
    vi.mocked(Html5QrcodeScanner).mockImplementationOnce(() => {
      throw new Error("camera denied");
    });

    render(<Scanner onDetected={vi.fn()} />);

    expect(screen.getByText("扫码功能不可用，可手动输入编号")).toBeInTheDocument();
  });

  it("swallows scanner teardown failures", () => {
    vi.mocked(Html5QrcodeScanner).mockImplementationOnce(() => ({
      render: renderMock,
      clear: () => Promise.reject(new Error("teardown failed")),
    }) as never);

    const { unmount } = render(<Scanner onDetected={vi.fn()} />);

    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
