import { useState } from "react";
import { createBackup, parseBackupJson } from "../domain/backup";
import { listGames, listTickets, replaceAllData } from "../storage/ticketRepository";

export function BackupPage({ onImported }: { onImported: () => Promise<void> }) {
  const [message, setMessage] = useState("");

  async function exportBackup() {
    const backup = createBackup(await listGames(), await listTickets());
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lottery-backup-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;

    try {
      const backup = parseBackupJson(await readFileText(file));
      await replaceAllData(backup.games, backup.tickets);
      await onImported();
      setMessage("导入完成");
    } catch (error) {
      setMessage(`导入失败：${error instanceof Error ? error.message : "备份文件格式无效"}`);
    }
  }

  return (
    <section className="page">
      <h1>备份恢复</h1>
      <button className="primary-button" type="button" onClick={exportBackup}>
        导出 JSON 备份
      </button>
      <label className="field">
        <span>导入 JSON 备份</span>
        <input
          type="file"
          accept="application/json"
          onChange={(event) => void importBackup(event.target.files?.[0])}
        />
      </label>
      {message && <p className="message">{message}</p>}
    </section>
  );
}

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
