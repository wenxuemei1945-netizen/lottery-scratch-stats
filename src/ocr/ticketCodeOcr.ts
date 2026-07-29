import Tesseract from "tesseract.js";

const TESSERACT_BASE_PATH = `${import.meta.env.BASE_URL}tesseract`;
const TICKET_CODE_PATTERN = /J\d{4}-\d{5}-\d{7}-\d{3}-\d/;

let workerPromise: Promise<Tesseract.Worker> | null = null;

export function extractTicketCode(text: string): string | null {
  const normalized = text
    .toUpperCase()
    .replace(/[ＯO]/g, "0")
    .replace(/[—–−_]/g, "-")
    .replace(/\s*-\s*/g, "-");
  const candidates = [normalized, normalized.replace(/\s+/g, "")];

  for (const candidate of candidates) {
    const match = candidate.match(TICKET_CODE_PATTERN);
    if (match) return match[0];
  }

  return null;
}

export async function recognizeTicketCode(image: File | Blob): Promise<string | null> {
  const worker = await getWorker();
  const processedImage = await prepareImageForTicketCodeOcr(image);
  const result = await worker.recognize(processedImage);
  return extractTicketCode(result.data.text);
}

async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY, {
      workerPath: `${TESSERACT_BASE_PATH}/worker.min.js`,
      corePath: TESSERACT_BASE_PATH,
      langPath: TESSERACT_BASE_PATH,
      gzip: true,
    }).then(async (worker) => {
      await worker.setParameters({
        tessedit_char_whitelist: "Jj0123456789- ",
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });
      return worker;
    });
  }

  return workerPromise;
}

async function prepareImageForTicketCodeOcr(image: File | Blob): Promise<HTMLCanvasElement> {
  const bitmap = await loadImageBitmap(image);
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;
  const cropTop = Math.floor(sourceHeight * 0.58);
  const cropHeight = sourceHeight - cropTop;
  const targetWidth = 1600;
  const targetHeight = Math.max(260, Math.round((cropHeight / sourceWidth) * targetWidth));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("当前浏览器无法处理照片");
  }

  context.drawImage(bitmap, 0, cropTop, sourceWidth, cropHeight, 0, 0, targetWidth, targetHeight);

  const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const highContrast = gray > 145 ? 255 : 0;
    data[index] = highContrast;
    data[index + 1] = highContrast;
    data[index + 2] = highContrast;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

async function loadImageBitmap(image: File | Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    return window.createImageBitmap(image);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(image);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("照片读取失败"));
    };
    img.src = url;
  });
}
