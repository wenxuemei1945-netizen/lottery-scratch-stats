import { describe, expect, it } from "vitest";
import { extractTicketCode } from "./ticketCodeOcr";

describe("ticket code OCR parsing", () => {
  it("extracts the printed lottery ticket code from OCR text", () => {
    expect(extractTicketCode("中国福利彩票\nJ0810-25273-0133810-109-3\n55次中奖机会")).toBe(
      "J0810-25273-0133810-109-3"
    );
  });

  it("normalizes common OCR spacing and letter mistakes", () => {
    expect(extractTicketCode("JO810 - 25273 - 013381O - 109 - 3")).toBe("J0810-25273-0133810-109-3");
  });
});
