import { useMemo, useState } from "react";
import type { Game } from "../domain/types";
import { Scanner } from "../scanner/Scanner";
import { saveGame, saveTicket } from "../storage/ticketRepository";

export function ScanPage({ games, onSaved }: { games: Game[]; onSaved: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [gameId, setGameId] = useState(games[0]?.id ?? "default-good-luck-10");
  const [message, setMessage] = useState("");

  const selectedGame = useMemo(
    () => games.find((game) => game.id === gameId) ?? defaultGame(),
    [gameId, games]
  );

  async function handleSave() {
    const cleanCode = code.trim();

    if (!cleanCode) {
      setMessage("请先扫描或输入彩票编号");
      return;
    }

    if (!games.some((game) => game.id === selectedGame.id)) {
      await saveGame(selectedGame);
    }

    const now = new Date().toISOString();

    await saveTicket({
      id: crypto.randomUUID(),
      code: cleanCode,
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      price: selectedGame.price,
      status: "unopened",
      prizeAmount: 0,
      purchasedAt: now.slice(0, 10),
      createdAt: now,
      updatedAt: now,
    });

    setCode("");
    setMessage("已保存为未刮开");
    await onSaved();
  }

  return (
    <section className="page">
      <h1>扫码入库</h1>
      <Scanner onDetected={setCode} />
      <label className="field">
        <span>彩票编号</span>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="扫描失败可手动输入"
        />
      </label>
      <label className="field">
        <span>票种</span>
        <select value={gameId} onChange={(event) => setGameId(event.target.value)}>
          {[...games, defaultGame()].map((game) => (
            <option key={game.id} value={game.id}>
              {game.name} / {game.price} 元
            </option>
          ))}
        </select>
      </label>
      <button className="primary-button" type="button" onClick={handleSave}>
        保存入库
      </button>
      {message && <p className="message">{message}</p>}
    </section>
  );
}

function defaultGame(): Game {
  const now = new Date().toISOString();

  return {
    id: "default-good-luck-10",
    name: "好运十倍",
    price: 10,
    topPrize: 400000,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}
