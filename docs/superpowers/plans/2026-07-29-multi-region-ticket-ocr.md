# Multi-Region Ticket OCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make photo recognition work across all current scratch ticket layouts by trying several barcode/number regions and reporting useful diagnostics when recognition fails.

**Architecture:** Keep OCR parsing in `src/ocr/ticketCodeOcr.ts`, add named crop templates for common bottom barcode placements, and return a structured result instead of only a nullable code. Keep the scan page responsible for deciding whether to auto-save or show failure details.

**Tech Stack:** React, TypeScript, Tesseract.js, Vitest, Vite PWA.

## Global Constraints

- The app must continue to run as a free PWA on GitHub Pages.
- OCR assets must remain same-origin under `public/tesseract` to avoid China/Hong Kong CDN failures.
- Ticket code format remains `Jdddd-ddddd-ddddddd-ddd-d`.
- If package information is complete, successful photo recognition should auto-save the ticket.
- If recognition fails, the page must still allow manual entry.

---

### Task 1: Multi-Region OCR Result Model

**Files:**
- Modify: `src/ocr/ticketCodeOcr.ts`
- Modify: `src/ocr/ticketCodeOcr.test.ts`

**Interfaces:**
- Produces: `recognizeTicketCode(image: File | Blob): Promise<TicketCodeRecognitionResult>`
- Produces: `extractTicketCode(text: string): string | null`
- Produces: `buildTicketCodeOcrRegions(width: number, height: number): TicketCodeOcrRegion[]`

- [ ] Write failing tests for multiple region definitions and OCR result shape.
- [ ] Run `vitest run src/ocr/ticketCodeOcr.test.ts --reporter=dot` and confirm failures.
- [ ] Implement the structured result and reusable crop-region builder.
- [ ] Run the OCR tests and confirm they pass.

### Task 2: Scan Page Diagnostics

**Files:**
- Modify: `src/pages/ScanPage.tsx`
- Modify: `src/pages/ScanPage.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `TicketCodeRecognitionResult`
- Produces: visible messages for failed OCR attempts and raw OCR text excerpts.

- [ ] Write failing tests for failed OCR diagnostics in the scan page.
- [ ] Run `vitest run src/pages/ScanPage.test.tsx --reporter=dot` and confirm failures.
- [ ] Update the scan page to use `result.code`, `result.attempts`, and `result.rawText`.
- [ ] Add compact diagnostic styling.
- [ ] Run the page tests and confirm they pass.

### Task 3: Verification and Publish

**Files:**
- Verify all changed files.

- [ ] Run `npm test -- --reporter=dot`.
- [ ] Run `npm run build`.
- [ ] Check a mobile-width browser DOM for the scan page controls.
- [ ] Commit the implementation.
- [ ] Publish to GitHub Pages with a non-forced update.
