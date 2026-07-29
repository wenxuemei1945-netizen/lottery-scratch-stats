import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { useEffect, useRef, useState } from "react";

type DetectedBarcode = {
  rawValue: string;
};

type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
};

const REQUESTED_BARCODE_FORMATS = ["code_128", "code_39", "ean_13", "qr_code"];
const ZXING_FORMATS = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.EAN_13,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
];

function getBarcodeDetectorConstructor() {
  return (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
}

async function createBarcodeDetector() {
  const BarcodeDetector = getBarcodeDetectorConstructor();

  if (!BarcodeDetector) return null;

  try {
    if (BarcodeDetector.getSupportedFormats) {
      const supportedFormats = await BarcodeDetector.getSupportedFormats();
      const formats = REQUESTED_BARCODE_FORMATS.filter((format) => supportedFormats.includes(format));

      return new BarcodeDetector(formats.length > 0 ? { formats } : undefined);
    }

    return new BarcodeDetector({ formats: REQUESTED_BARCODE_FORMATS });
  } catch {
    return null;
  }
}

export function Scanner({ onDetected }: { onDetected: (code: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState("点击按钮后打开摄像头");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const cropFrameRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  async function startScanning() {
    if (scanningRef.current) return;

    const video = videoRef.current;

    if (!video || !navigator.mediaDevices?.getUserMedia) {
      setError("摄像头不可用，可手动输入编号");
      return;
    }

    try {
      setError(null);
      setHint("正在打开摄像头");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      scanningRef.current = true;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      await video.play();
      setScanning(true);
      setHint("请把彩票底部条码放入画面");

      void startBarcodeDetection(video);
    } catch {
      stopScanning();
      setError("摄像头不可用，可手动输入编号");
      setHint("点击按钮后打开摄像头");
    }
  }

  async function startBarcodeDetection(video: HTMLVideoElement) {
    const nativeDetector = await createBarcodeDetector();

    if (nativeDetector) {
      scanFrame(nativeDetector);
    }

    await startZxingDetection(video);
  }

  async function startZxingDetection(video: HTMLVideoElement) {
    try {
      if (!scanningRef.current) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 180 });

      zxingControlsRef.current = reader.scan(video, (result) => {
        const code = result?.getText().trim();

        if (code) {
          onDetected(code);
          stopScanning();
        }
      });
      scanCroppedBarcode(video, reader);
      setHint("将彩票底部条码对准框内");
    } catch (cause) {
      const message = cause instanceof Error && cause.message ? cause.message : "未知错误";
      setHint(`自动识别启动失败：${message}，可手动输入编号`);
    }
  }

  function scanCroppedBarcode(video: HTMLVideoElement, reader: BrowserMultiFormatReader) {
    if (!scanningRef.current) return;

    cropFrameRef.current = requestAnimationFrame(() => {
      if (!scanningRef.current) return;

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      if (videoWidth <= 0 || videoHeight <= 0) {
        scanCroppedBarcode(video, reader);
        return;
      }

      const sourceWidth = Math.round(videoWidth * 0.86);
      const sourceHeight = Math.round(videoHeight * 0.28);
      const sourceX = Math.round((videoWidth - sourceWidth) / 2);
      const sourceY = Math.round((videoHeight - sourceHeight) / 2);
      const canvas = document.createElement("canvas");
      canvas.width = 1100;
      canvas.height = 320;
      const context = canvas.getContext("2d");

      if (!context) {
        scanCroppedBarcode(video, reader);
        return;
      }

      context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

      try {
        const code = reader.decodeFromCanvas(canvas).getText().trim();

        if (code) {
          onDetected(code);
          stopScanning();
          return;
        }
      } catch {
        // Most frames do not contain a readable barcode.
      }

      window.setTimeout(() => scanCroppedBarcode(video, reader), 180);
    });
  }

  function scanFrame(detector: BarcodeDetectorInstance) {
    const video = videoRef.current;

    if (!video || !scanningRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      void detector
        .detect(video)
        .then((barcodes) => {
          const code = barcodes[0]?.rawValue?.trim();

          if (code) {
            onDetected(code);
            stopScanning();
            return;
          }

          scanFrame(detector);
        })
        .catch(() => scanFrame(detector));
    });
  }

  function stopScanning() {
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (cropFrameRef.current !== null) {
      cancelAnimationFrame(cropFrameRef.current);
      cropFrameRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // Some embedded browsers expose media streams but fail on pause.
      }
      videoRef.current.srcObject = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    scanningRef.current = false;
    setScanning(false);
    setHint("点击按钮后打开摄像头");
  }

  return (
    <div className="scanner-shell">
      <div className="scanner-box">
        <video ref={videoRef} className="scanner-video" title="摄像头预览" />
        {scanning && (
          <div className="scanner-target" aria-label="条码取景框">
            <span>将条码放入框内</span>
          </div>
        )}
        {!scanning && <span className="scanner-placeholder">摄像头预览</span>}
      </div>
      <button className="ghost-button" type="button" onClick={() => (scanning ? stopScanning() : void startScanning())}>
        {scanning ? "停止扫码" : "启动扫码"}
      </button>
      <p className="scanner-help">{error ?? hint}</p>
    </div>
  );
}
