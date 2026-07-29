import { describe, expect, it } from "vitest";
import { buildTicketCodeOcrRegions, createTicketCodeRecognitionResult, extractTicketCode } from "./ticketCodeOcr";

describe("ticket code OCR parsing", () => {
  it("extracts the printed lottery ticket code from OCR text", () => {
    expect(extractTicketCode("中国福利彩票\nJ0810-25273-0133810-109-3\n55次中奖机会")).toBe(
      "J0810-25273-0133810-109-3"
    );
  });

  it("normalizes common OCR spacing and letter mistakes", () => {
    expect(extractTicketCode("JO810 - 25273 - 013381O - 109 - 3")).toBe("J0810-25273-0133810-109-3");
  });

  it("builds several bottom barcode regions for different ticket layouts", () => {
    const regions = buildTicketCodeOcrRegions(1200, 1800);

    expect(regions.map((region) => region.id)).toEqual([
      "bottom-right-number",
      "bottom-center-number",
      "bottom-full-strip",
      "lower-right-wide",
      "lower-left-wide",
      "middle-lower-strip",
    ]);
    expect(regions.every((region) => region.x >= 0 && region.y >= 0 && region.width > 0 && region.height > 0)).toBe(true);
    expect(regions.every((region) => region.x + region.width <= 1200 && region.y + region.height <= 1800)).toBe(true);
  });

  it("returns the first valid code with OCR diagnostics", () => {
    expect(
      createTicketCodeRecognitionResult([
        { regionId: "bottom-right-number", text: "not clear" },
        { regionId: "bottom-center-number", text: "J0791-26101-0357483-108-3" },
      ])
    ).toEqual({
      code: "J0791-26101-0357483-108-3",
      rawText: "not clear\nJ0791-26101-0357483-108-3",
      attempts: [
        { regionId: "bottom-right-number", text: "not clear" },
        { regionId: "bottom-center-number", text: "J0791-26101-0357483-108-3" },
      ],
    });
  });

  it("returns raw OCR text when every region fails", () => {
    expect(
      createTicketCodeRecognitionResult([
        { regionId: "bottom-right-number", text: "" },
        { regionId: "bottom-center-number", text: "J0810 25273" },
      ])
    ).toEqual({
      code: null,
      rawText: "J0810 25273",
      attempts: [
        { regionId: "bottom-right-number", text: "" },
        { regionId: "bottom-center-number", text: "J0810 25273" },
      ],
    });
  });
});
