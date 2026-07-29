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

      const detector = await createBarcodeDetector();

      if (!detector) {
        setHint("摄像头已打开，如未自动识别请手动输入编号");
        return;
      }

      scanFrame(detector);
    } catch {
      stopScanning();
      setError("摄像头不可用，可手动输入编号");
      setHint("点击按钮后打开摄像头");
    }
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
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
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
        {!scanning && <span className="scanner-placeholder">摄像头预览</span>}
      </div>
      <button className="ghost-button" type="button" onClick={() => (scanning ? stopScanning() : void startScanning())}>
        {scanning ? "停止扫码" : "启动扫码"}
      </button>
      <p className="scanner-help">{error ?? hint}</p>
    </div>
  );
}
