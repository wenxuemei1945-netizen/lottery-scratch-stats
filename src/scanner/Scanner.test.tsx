import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Scanner } from "./Scanner";

const getUserMediaMock = vi.fn();
const playMock = vi.fn();
const pauseMock = vi.fn();
const stopTrackMock = vi.fn();
const detectMock = vi.fn();
const zxingScanMock = vi.fn();
const zxingStopMock = vi.fn();

class MockBarcodeDetector {
  static getSupportedFormats = vi.fn().mockResolvedValue(["code_128", "qr_code"]);

  detect = detectMock;
}

vi.mock("@zxing/browser", () => ({
  BarcodeFormat: {
    CODE_128: "CODE_128",
    CODE_39: "CODE_39",
    CODE_93: "CODE_93",
    EAN_13: "EAN_13",
    ITF: "ITF",
    QR_CODE: "QR_CODE",
  },
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    scan: zxingScanMock,
  })),
}));

describe("Scanner", () => {
  beforeEach(() => {
    getUserMediaMock.mockReset();
    playMock.mockReset();
    pauseMock.mockReset();
    stopTrackMock.mockReset();
    detectMock.mockReset();
    zxingScanMock.mockReset();
    zxingStopMock.mockReset();
    playMock.mockResolvedValue(undefined);
    detectMock.mockResolvedValue([]);
    zxingScanMock.mockReturnValue({ stop: zxingStopMock });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: playMock,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: pauseMock,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: getUserMediaMock,
      },
    });
    Object.defineProperty(window, "BarcodeDetector", {
      configurable: true,
      value: MockBarcodeDetector,
    });
    getUserMediaMock.mockResolvedValue({
      getTracks: () => [{ stop: stopTrackMock }],
    });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(performance.now()), 0);
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  });

  it("opens a native camera preview when start is clicked", async () => {
    render(<Scanner onDetected={vi.fn()} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "启动扫码" }));

    const video = screen.getByTitle("摄像头预览") as HTMLVideoElement;
    expect(getUserMediaMock).toHaveBeenCalledWith({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        height: { ideal: 720 },
        width: { ideal: 1280 },
      },
    });
    expect(video.srcObject).toBeTruthy();
    expect(video.getAttribute("playsinline")).toBe("true");
    expect(screen.getByRole("button", { name: "停止扫码" })).toBeInTheDocument();
  });

  it("reports a barcode when the browser detector finds one", async () => {
    const onDetected = vi.fn();
    detectMock.mockResolvedValueOnce([{ rawValue: "J0353-26082-0564563-133-3" }]);

    render(<Scanner onDetected={onDetected} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "启动扫码" }));

    await waitFor(() => expect(onDetected).toHaveBeenCalledWith("J0353-26082-0564563-133-3"));
    expect(stopTrackMock).toHaveBeenCalled();
  });

  it("reports a barcode through ZXing when the browser detector is unavailable", async () => {
    Object.defineProperty(window, "BarcodeDetector", {
      configurable: true,
      value: undefined,
    });
    const onDetected = vi.fn();
    zxingScanMock.mockImplementation((_video, callback) => {
      window.setTimeout(() => callback({ getText: () => "J0810-25273-0133810-109-3" }, undefined), 0);
      return { stop: zxingStopMock };
    });

    render(<Scanner onDetected={onDetected} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "启动扫码" }));

    await waitFor(() => expect(onDetected).toHaveBeenCalledWith("J0810-25273-0133810-109-3"));
    expect(zxingScanMock).toHaveBeenCalled();
    expect(zxingStopMock).toHaveBeenCalled();
  });

  it("shows a fallback message when camera startup fails", async () => {
    getUserMediaMock.mockRejectedValueOnce(new Error("camera denied"));

    render(<Scanner onDetected={vi.fn()} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "启动扫码" }));

    expect(await screen.findByText("摄像头不可用，可手动输入编号")).toBeInTheDocument();
  });
});
