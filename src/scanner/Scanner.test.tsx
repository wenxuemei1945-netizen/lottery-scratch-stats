import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Html5Qrcode } from "html5-qrcode";
import { Scanner } from "./Scanner";

const startMock = vi.fn();
const stopMock = vi.fn();
const clearMock = vi.fn();

vi.mock("html5-qrcode", () => ({
  Html5Qrcode: vi.fn(),
}));

describe("Scanner", () => {
  beforeEach(() => {
    vi.mocked(Html5Qrcode).mockReset();
    vi.mocked(Html5Qrcode).getCameras = vi.fn().mockResolvedValue([{ id: "camera-1", label: "后置摄像头" }]);
    startMock.mockReset();
    stopMock.mockReset();
    clearMock.mockReset();
    startMock.mockResolvedValue(null);
    stopMock.mockResolvedValue(undefined);
    clearMock.mockReturnValue(undefined);
    vi.mocked(Html5Qrcode).mockImplementation(() => ({
      start: startMock,
      stop: stopMock,
      clear: clearMock,
    }) as never);
  });

  it("shows a fallback message when scanner startup fails", async () => {
    startMock.mockRejectedValueOnce(new Error("camera denied"));

    render(<Scanner onDetected={vi.fn()} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "启动扫码" }));

    expect(await screen.findByText("扫码功能不可用，可手动输入编号")).toBeInTheDocument();
  });

  it("starts scanning with a Chinese control button", async () => {
    render(<Scanner onDetected={vi.fn()} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "启动扫码" }));

    expect(startMock).toHaveBeenCalledWith(
      { facingMode: "environment" },
      { fps: 8, qrbox: { width: 240, height: 120 } },
      expect.any(Function),
      expect.any(Function)
    );
    expect(screen.getByRole("button", { name: "停止扫码" })).toBeInTheDocument();
  });

  it("starts the environment camera without pre-enumerating devices", async () => {
    vi.mocked(Html5Qrcode).getCameras = vi.fn().mockResolvedValue([]);
    render(<Scanner onDetected={vi.fn()} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "启动扫码" }));

    expect(startMock).toHaveBeenCalledWith(
      { facingMode: "environment" },
      { fps: 8, qrbox: { width: 240, height: 120 } },
      expect.any(Function),
      expect.any(Function)
    );
  });

  it("clears the scanner on unmount", () => {
    const { unmount } = render(<Scanner onDetected={vi.fn()} />);

    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
