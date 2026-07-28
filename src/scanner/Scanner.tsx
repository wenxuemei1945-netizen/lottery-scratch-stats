import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useId, useRef } from "react";

export function Scanner({ onDetected }: { onDetected: (code: string) => void }) {
  const elementId = useId().replace(/:/g, "");
  const hasDetected = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
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

    return () => {
      void scanner.clear();
    };
  }, [elementId, onDetected]);

  return <div className="scanner-box" id={elementId} />;
}
