import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

interface QRCodeDisplayProps {
  code: string;
  size?: number;
}

const QRCodeDisplay = ({ code, size = 300 }: QRCodeDisplayProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling({
        width: size,
        height: size,
        data: code,
        dotsOptions: {
          color: "hsl(215, 70%, 45%)",
          type: "rounded",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        cornersSquareOptions: {
          color: "hsl(185, 60%, 50%)",
          type: "extra-rounded",
        },
        cornersDotOptions: {
          color: "hsl(215, 70%, 45%)",
          type: "dot",
        },
      });
    }

    if (ref.current) {
      ref.current.innerHTML = "";
      qrCode.current.append(ref.current);
    }
  }, []);

  useEffect(() => {
    if (qrCode.current) {
      qrCode.current.update({
        data: code,
      });
    }
  }, [code]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-inner">
      <div ref={ref} />
      <p className="mt-4 text-2xl font-mono font-bold text-primary tracking-wider">
        {code}
      </p>
    </div>
  );
};

export default QRCodeDisplay;
