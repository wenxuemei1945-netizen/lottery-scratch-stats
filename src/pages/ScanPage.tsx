import { useMemo, useState } from "react";
import { DEFAULT_GAMES, mergeWithDefaultGames } from "../domain/defaultGames";
import type { Game } from "../domain/types";
import { Scanner } from "../scanner/Scanner";
import { getTicketByCode, saveGame, saveTicket } from "../storage/ticketRepository";

export function ScanPage({ games, onSaved }: { games: Game[]; onSaved: () => Promise<void> }) {
  const gameOptions = useMemo(() => mergeWithDefaultGames(games), [games]);
  const [code, setCode] = useState("");
  const [gameId, setGameId] = useState(games[0]?.id ?? DEFAULT_GAMES[0].id);
  const [packName, setPackName] = useState("");
  const [packIndex, setPackIndex] = useState("1");
  const [message, setMessage] = useState("");

  const selectedGame = useMemo(
    () => gameOptions.find((game) => game.id === gameId) ?? gameOptions[0],
    [gameId, gameOptions]
  );

  async function handleSave() {
    const cleanCode = code.trim();

    if (!cleanCode) {
      setMessage("请先扫描或输入彩票编号");
      return;
    }

    const cleanPackName = packName.trim();

    if (!cleanPackName) {
      setMessage("请输入包号");
      return;
    }

    const cleanPackIndex = Number(packIndex);

    if (!Number.isInteger(cleanPackIndex) || cleanPackIndex <= 0) {
      setMessage("本包序号必须是大于 0 的整数");
      return;
    }

    if (selectedGame.packSize && cleanPackIndex > selectedGame.packSize) {
      setMessage(`本票种每包最多 ${selectedGame.packSize} 张`);
      return;
    }

    if (await getTicketByCode(cleanCode)) {
      setMessage("彩票编号已存在");
      return;
    }

    try {
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
        packId: `${selectedGame.id}:${cleanPackName}`,
        packName: cleanPackName,
        packIndex: cleanPackIndex,
        packSize: selectedGame.packSize,
        status: "unopened",
        prizeAmount: 0,
        purchasedAt: now.slice(0, 10),
        createdAt: now,
        updatedAt: now,
      });

      setCode("");
      setPackIndex(String(cleanPackIndex + 1));
      setMessage("已保存为未刮开");
      await onSaved();
    } catch (cause) {
      const errorMessage = cause instanceof Error ? cause.message : "";
      setMessage(errorMessage.includes("已存在") ? "彩票编号已存在" : "保存失败，请重试");
    }
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
          {gameOptions.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name} / {game.price} 元{game.packSize ? ` / ${game.packSize} 张/包` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>包号</span>
        <input
          value={packName}
          onChange={(event) => setPackName(event.target.value)}
          placeholder="例如：好运十倍-001"
        />
      </label>
      <label className="field">
        <span>本包第几张</span>
        <input
          inputMode="numeric"
          value={packIndex}
          onChange={(event) => setPackIndex(event.target.value)}
        />
      </label>
      <button className="primary-button" type="button" onClick={handleSave}>
        保存入库
      </button>
      {message && <p className="message">{message}</p>}
    </section>
  );
}
