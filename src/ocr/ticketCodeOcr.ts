import Tesseract from "tesseract.js";

const TESSERACT_BASE_PATH = `${import.meta.env.BASE_URL}tesseract`;
const TICKET_CODE_PATTERN = /J\d{4}-\d{5}-\d{7}-\d{3}-\d/;

export interface TicketCodeOcrRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TicketCodeOcrAttempt {
  regionId: string;
  text: string;
}

export interface TicketCodeRecognitionResult {
  code: string | null;
  rawText: string;
  attempts: TicketCodeOcrAttempt[];
}

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

export function buildTicketCodeOcrRegions(width: number, height: number): TicketCodeOcrRegion[] {
  const definitions = [
    { id: "bottom-right-number", x: 0.48, y: 0.82, width: 0.5, height: 0.13 },
    { id: "bottom-center-number", x: 0.23, y: 0.8, width: 0.62, height: 0.15 },
    { id: "bottom-full-strip", x: 0.04, y: 0.76, width: 0.92, height: 0.21 },
    { id: "lower-right-wide", x: 0.36, y: 0.68, width: 0.6, height: 0.25 },
    { id: "lower-left-wide", x: 0.04, y: 0.68, width: 0.6, height: 0.25 },
    { id: "middle-lower-strip", x: 0.08, y: 0.54, width: 0.84, height: 0.22 },
  ];

  return definitions.map((definition) => clampRegion(definition, width, height));
}

export function createTicketCodeRecognitionResult(attempts: TicketCodeOcrAttempt[]): TicketCodeRecognitionResult {
  const rawText = attempts
    .map((attempt) => attempt.text.trim())
    .filter(Boolean)
    .join("\n");

  for (const attempt of attempts) {
    const code = extractTicketCode(attempt.text);
    if (code) {
      return { code, rawText, attempts };
    }
  }

  return { code: null, rawText, attempts };
}

export async function recognizeTicketCode(image: File | Blob): Promise<TicketCodeRecognitionResult> {
  const worker = await getWorker();
  const bitmap = await loadImageBitmap(image);
  const regions = buildTicketCodeOcrRegions(bitmap.width, bitmap.height);
  const attempts: TicketCodeOcrAttempt[] = [];

  for (const region of regions) {
    const processedImage = prepareRegionForTicketCodeOcr(bitmap, region);
    const result = await worker.recognize(processedImage);
    const text = result.data.text;
    attempts.push({ regionId: region.id, text });

    if (extractTicketCode(text)) {
      break;
    }
  }

  return createTicketCodeRecognitionResult(attempts);
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

function prepareRegionForTicketCodeOcr(
  image: ImageBitmap | HTMLImageElement,
  region: TicketCodeOcrRegion
): HTMLCanvasElement {
  const targetWidth = 1800;
  const targetHeight = Math.max(240, Math.round((region.height / region.width) * targetWidth));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("当前浏览器无法处理照片");
  }

  context.drawImage(image, region.x, region.y, region.width, region.height, 0, 0, targetWidth, targetHeight);
  enhanceTicketCodeCanvas(context, targetWidth, targetHeight);
  return canvas;
}

function enhanceTicketCodeCanvas(context: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const boosted = gray < 135 ? 0 : gray > 205 ? 255 : Math.round((gray - 135) * 3.64);
    data[index] = boosted;
    data[index + 1] = boosted;
    data[index + 2] = boosted;
  }

  context.putImageData(imageData, 0, 0);
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

function clampRegion(
  definition: { id: string; x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number
): TicketCodeOcrRegion {
  const x = Math.round(definition.x * imageWidth);
  const y = Math.round(definition.y * imageHeight);
  const width = Math.min(Math.round(definition.width * imageWidth), imageWidth - x);
  const height = Math.min(Math.round(definition.height * imageHeight), imageHeight - y);
  return { id: definition.id, x, y, width, height };
}
