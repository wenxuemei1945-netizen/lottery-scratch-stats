import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";

export function Scanner({ onDetected }: { onDetected: (code: string) => void }) {
  const elementId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const hasDetected = useRef(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    try {
      scanner = new Html5QrcodeScanner(
        elementId,
        { fps: 8, qrbox: { width: 240, height: 120 }, rememberLastUsedCamera: true },
        false
      );

      scanner.render(
        (decodedText) => {
          if (!hasDetected.current) {
            hasDetected.current = true;
            onDetected(decodedText.trim());
          }
        },
        () => undefined
      );
    } catch {
      setError("扫码功能不可用，可手动输入编号");
    }

    return () => {
      void scanner?.clear().catch(() => undefined);
    };
  }, [elementId, onDetected]);

  return (
    <div className="scanner-shell">
      <div className="scanner-box" id={elementId} />
      {error && <p className="scanner-help">{error}</p>}
    </div>
  );
}
