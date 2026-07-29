import { useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { DEFAULT_GAMES, mergeWithDefaultGames } from "../domain/defaultGames";
import type { Game } from "../domain/types";
import { recognizeTicketCode } from "../ocr/ticketCodeOcr";
import { Scanner } from "../scanner/Scanner";
import { getTicketByCode, saveGame, saveTicket } from "../storage/ticketRepository";

export function ScanPage({ games, onSaved }: { games: Game[]; onSaved: () => Promise<void> }) {
  const gameOptions = useMemo(() => mergeWithDefaultGames(games), [games]);
  const [code, setCode] = useState("");
  const [gameId, setGameId] = useState(games[0]?.id ?? DEFAULT_GAMES[0].id);
  const [packName, setPackName] = useState("");
  const [packIndex, setPackIndex] = useState("1");
  const [message, setMessage] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const selectedGame = useMemo(
    () => gameOptions.find((game) => game.id === gameId) ?? gameOptions[0],
    [gameId, gameOptions]
  );

  async function saveTicketRecord(cleanCode: string, successMessage = "已保存为未刮开"): Promise<boolean> {
    if (!cleanCode) {
      setMessage("请先扫描或输入彩票编号");
      return false;
    }

    const cleanPackName = packName.trim();

    if (!cleanPackName) {
      setMessage("请输入包号");
      return false;
    }

    const cleanPackIndex = Number(packIndex);

    if (!Number.isInteger(cleanPackIndex) || cleanPackIndex <= 0) {
      setMessage("本包序号必须是大于 0 的整数");
      return false;
    }

    if (selectedGame.packSize && cleanPackIndex > selectedGame.packSize) {
      setMessage(`本票种每包最多 ${selectedGame.packSize} 张`);
      return false;
    }

    if (await getTicketByCode(cleanCode)) {
      setMessage("彩票编号已存在");
      return false;
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
      setMessage(successMessage);
      await onSaved();
      return true;
    } catch (cause) {
      const errorMessage = cause instanceof Error ? cause.message : "";
      setMessage(errorMessage.includes("已存在") ? "彩票编号已存在" : "保存失败，请重试");
      return false;
    }
  }

  async function handleSave() {
    await saveTicketRecord(code.trim());
  }

  async function handlePhotoRecognition(file: File | undefined) {
    if (!file || recognizing) return;

    setRecognizing(true);
    setMessage("正在识别照片编号...");

    try {
      const detectedCode = await recognizeTicketCode(file);

      if (!detectedCode) {
        setMessage("未识别到编号，请重新拍摄底部编号或手动输入");
        return;
      }

      setCode(detectedCode);

      if (packName.trim() && packIndex.trim()) {
        const saved = await saveTicketRecord(detectedCode, "已拍照识别并保存入库");
        if (!saved) return;
      } else {
        setMessage("已识别编号，请填写包号后保存入库");
      }
    } catch {
      setMessage("照片识别失败，请重新拍摄底部编号或手动输入");
    } finally {
      setRecognizing(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="page">
      <h1>扫码入库</h1>
      <Scanner onDetected={setCode} />
      <label className="photo-ocr-button">
        <Camera aria-hidden="true" size={18} />
        {recognizing ? "正在识别..." : "拍照识别编号"}
        <input
          ref={photoInputRef}
          aria-label="拍照识别编号"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={recognizing}
          onChange={(event) => void handlePhotoRecognition(event.target.files?.[0])}
        />
      </label>
      <p className="scanner-help">iPhone 如无法实时扫码，请拍清票面底部条码下方的编号。</p>
      <label className="field">
        <span>彩票编号</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="扫描失败可手动输入" />
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
        <input value={packName} onChange={(event) => setPackName(event.target.value)} placeholder="例如：好运十倍-001" />
      </label>
      <label className="field">
        <span>本包第几张</span>
        <input inputMode="numeric" value={packIndex} onChange={(event) => setPackIndex(event.target.value)} />
      </label>
      <button className="primary-button" type="button" onClick={handleSave}>
        保存入库
      </button>
      {message && <p className="message">{message}</p>}
    </section>
  );
}
