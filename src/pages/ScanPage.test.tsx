import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTicketByCode, resetDatabase, saveTicket } from "../storage/ticketRepository";
import { makeGame, makeTicket } from "../test/testData";
import { ScanPage } from "./ScanPage";

const recognizeTicketCodeMock = vi.hoisted(() => vi.fn());

vi.mock("../ocr/ticketCodeOcr", () => ({
  recognizeTicketCode: recognizeTicketCodeMock,
}));

vi.mock("../scanner/Scanner", () => ({
  Scanner: ({ onDetected }: { onDetected: (code: string) => void }) => (
    <button type="button" onClick={() => onDetected("MOCK-SCANNED-CODE")}>
      模拟扫码
    </button>
  ),
}));

describe("ScanPage", () => {
  beforeEach(async () => {
    await resetDatabase();
    recognizeTicketCodeMock.mockReset();
  });

  it("creates an unopened ticket from manual code entry", async () => {
    const onSaved = vi.fn();
    render(<ScanPage games={[makeGame()]} onSaved={onSaved} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("彩票编号"), "J0353-26082-0564563-133-3");
    await user.type(screen.getByLabelText("包号"), "好运十倍-001");
    await user.click(screen.getByRole("button", { name: "保存入库" }));
    await screen.findByText("已保存为未刮开");

    const ticket = await getTicketByCode("J0353-26082-0564563-133-3");
    expect(ticket).toEqual(
      expect.objectContaining({
        status: "unopened",
        gameName: "好运十倍",
        price: 10,
        packId: "game-1:好运十倍-001",
        packName: "好运十倍-001",
        packIndex: 1,
        packSize: 50,
      })
    );
    expect(screen.getByLabelText("本包第几张")).toHaveValue("2");
    expect(onSaved).toHaveBeenCalled();
  });

  it("requires a package code before saving", async () => {
    const onSaved = vi.fn();
    render(<ScanPage games={[makeGame()]} onSaved={onSaved} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("彩票编号"), "J0353-26082-0564563-133-3");
    await user.click(screen.getByRole("button", { name: "保存入库" }));

    expect(await screen.findByText("请输入包号")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("does not duplicate the default game option when it already exists", () => {
    render(
      <ScanPage
        games={[
          makeGame({ id: "default-good-luck-10", name: "好运十倍", price: 10 }),
          makeGame({ id: "game-2", name: "快乐星球", price: 20 }),
        ]}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getAllByRole("option", { name: "好运十倍 / 10 元 / 50 张/包" })).toHaveLength(1);
  });

  it("shows all built-in ticket types when no games are saved yet", () => {
    render(<ScanPage games={[]} onSaved={vi.fn()} />);

    expect(screen.getAllByRole("option")).toHaveLength(13);
    expect(screen.getByRole("option", { name: "正当红 / 50 元 / 20 张/包" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "喜相逢-心想事成 / 10 元 / 50 张/包" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "好运十倍 / 10 元 / 50 张/包" })).toBeInTheDocument();
  });

  it("shows a duplicate code message when the ticket code already exists", async () => {
    await saveTicket(makeTicket({ code: "DUPLICATE-CODE-001" }));

    const onSaved = vi.fn();
    render(<ScanPage games={[makeGame()]} onSaved={onSaved} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("彩票编号"), "DUPLICATE-CODE-001");
    await user.type(screen.getByLabelText("包号"), "好运十倍-001");
    await user.click(screen.getByRole("button", { name: "保存入库" }));

    expect(await screen.findByText("彩票编号已存在")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("fills the code field from scanner detection", async () => {
    render(<ScanPage games={[makeGame()]} onSaved={vi.fn()} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "模拟扫码" }));

    expect(screen.getByLabelText("彩票编号")).toHaveValue("MOCK-SCANNED-CODE");
  });

  it("fills the code field from photo OCR when package information is incomplete", async () => {
    recognizeTicketCodeMock.mockResolvedValue("J0810-25273-0133810-109-3");
    render(<ScanPage games={[makeGame()]} onSaved={vi.fn()} />);

    const user = userEvent.setup();
    const image = new File(["ticket"], "ticket.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("拍照识别编号"), image);

    expect(await screen.findByText("已识别编号，请填写包号后保存入库")).toBeInTheDocument();
    expect(screen.getByLabelText("彩票编号")).toHaveValue("J0810-25273-0133810-109-3");
  });

  it("automatically saves a ticket after photo OCR when package information is ready", async () => {
    recognizeTicketCodeMock.mockResolvedValue("J0810-25273-0133810-109-3");
    const onSaved = vi.fn();
    render(<ScanPage games={[makeGame()]} onSaved={onSaved} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("包号"), "好运十倍-001");
    const image = new File(["ticket"], "ticket.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("拍照识别编号"), image);

    expect(await screen.findByText("已拍照识别并保存入库")).toBeInTheDocument();
    expect(await getTicketByCode("J0810-25273-0133810-109-3")).toEqual(
      expect.objectContaining({
        code: "J0810-25273-0133810-109-3",
        packName: "好运十倍-001",
        packIndex: 1,
      })
    );
    expect(screen.getByLabelText("本包第几张")).toHaveValue("2");
    expect(onSaved).toHaveBeenCalled();
  });
});
