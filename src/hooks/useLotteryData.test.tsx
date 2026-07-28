import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLotteryData } from "./useLotteryData";
import { listGames, listTickets } from "../storage/ticketRepository";

vi.mock("../storage/ticketRepository", () => ({
  listTickets: vi.fn(),
  listGames: vi.fn(),
}));

const listTicketsMock = vi.mocked(listTickets);
const listGamesMock = vi.mocked(listGames);

describe("useLotteryData", () => {
  beforeEach(() => {
    listTicketsMock.mockReset();
    listGamesMock.mockReset();
  });

  it("clears loading and exposes an error when reload fails", async () => {
    listTicketsMock.mockResolvedValueOnce([]);
    listGamesMock.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useLotteryData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    listTicketsMock.mockRejectedValueOnce(new Error("IndexedDB unavailable"));
    listGamesMock.mockResolvedValueOnce([]);

    await act(async () => {
      await result.current.reload().catch(() => undefined);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("IndexedDB unavailable");
  });
});
