import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";

export function Scanner({ onDetected }: { onDetected: (code: string) => void }) {
  const elementId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const hasDetected = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode(elementId, { verbose: false });

    return () => {
      const scanner = scannerRef.current;

      if (!scanner) return;

      if (scanningRef.current) {
        void scanner.stop().finally(() => scanner.clear()).catch(() => undefined);
      } else {
        scanner.clear();
      }
    };
  }, [elementId, onDetected]);

  async function startScanning() {
    const scanner = scannerRef.current;

    if (!scanner) {
      setError("扫码功能不可用，可手动输入编号");
      return;
    }

    try {
      setError(null);
      hasDetected.current = false;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 120 } },
        (decodedText) => {
          if (!hasDetected.current) {
            hasDetected.current = true;
            onDetected(decodedText.trim());
            void stopScanning();
          }
        },
        () => undefined
      );
      scanningRef.current = true;
      setScanning(true);
    } catch {
      setError("扫码功能不可用，可手动输入编号");
      scanningRef.current = false;
      setScanning(false);
    }
  }

  async function stopScanning() {
    const scanner = scannerRef.current;

    if (!scanner || !scanningRef.current) return;

    try {
      await scanner.stop();
    } catch {
      setError("停止扫码失败，请刷新页面后重试");
    } finally {
      scanningRef.current = false;
      setScanning(false);
    }
  }

  return (
    <div className="scanner-shell">
      <div className="scanner-box" id={elementId} />
      <button className="ghost-button" type="button" onClick={() => void (scanning ? stopScanning() : startScanning())}>
        {scanning ? "停止扫码" : "启动扫码"}
      </button>
      {error && <p className="scanner-help">{error}</p>}
    </div>
  );
}
