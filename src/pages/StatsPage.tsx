import { useMemo, useState } from "react";
import { calculateGameStats, calculateOverallStats, calculatePackStats, type GameStats } from "../domain/stats";
import type { Ticket } from "../domain/types";

export function StatsPage({ tickets }: { tickets: Ticket[] }) {
  const [selectedGameId, setSelectedGameId] = useState("all");
  const overall = calculateOverallStats(tickets);
  const gameStats = calculateGameStats(tickets);
  const selectedGame = selectedGameId === "all" ? null : gameStats.find((game) => game.gameId === selectedGameId) ?? null;
  const filteredTickets = useMemo(
    () => (selectedGameId === "all" ? tickets : tickets.filter((ticket) => ticket.gameId === selectedGameId)),
    [selectedGameId, tickets]
  );
  const filteredGameStats = selectedGame ? [selectedGame] : gameStats;
  const packStats = calculatePackStats(filteredTickets);

  return (
    <section className="page">
      <h1>统计报表</h1>
      <div className="report-summary">
        <span>总投入 {overall.totalInvestment} 元</span>
        <span>回报率 {Math.round(overall.returnRate * 100)}%</span>
      </div>

      <label className="field">
        <span>选择票种</span>
        <select value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)}>
          <option value="all">全部票种</option>
          {gameStats.map((game) => (
            <option key={game.gameId} value={game.gameId}>
              {game.gameName}
            </option>
          ))}
        </select>
      </label>

      {selectedGame && <GameDetail game={selectedGame} />}

      <div className="list-stack">
        <h2>按包统计</h2>
        {packStats.map((pack) => (
          <article className="list-row" key={pack.packId}>
            <div>
              <strong>{pack.packName}</strong>
              <span>
                {pack.gameName} / {pack.totalTickets}
                {pack.packSize ? `/${pack.packSize}` : ""} 张
              </span>
              <span>
                投入 {pack.totalInvestment} 元 / 中奖 {pack.totalPrize} 元
              </span>
            </div>
            <strong className={pack.netProfit >= 0 ? "money-good" : "money-bad"}>{formatSigned(pack.netProfit)} 元</strong>
          </article>
        ))}
        <h2>按票种统计</h2>
        {filteredGameStats.map((game) => (
          <article className="list-row" key={game.gameId}>
            <div>
              <strong>{game.gameName}</strong>
              <span>
                {game.totalTickets} 张 / 已刮 {game.scratchedTickets} 张 / 未刮 {game.unopenedTickets} 张
              </span>
              <span>
                中奖 {game.winningTickets} 张 / 中奖金额 {game.totalPrize} 元
              </span>
            </div>
            <strong className={game.netProfit >= 0 ? "money-good" : "money-bad"}>{formatSigned(game.netProfit)} 元</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function GameDetail({ game }: { game: GameStats }) {
  return (
    <section className="stat-detail" aria-label="票种明细">
      <h2>{game.gameName}</h2>
      <p>
        总数 {game.totalTickets} 张 / 已刮 {game.scratchedTickets} 张 / 未刮 {game.unopenedTickets} 张
      </p>
      <p>
        中奖 {game.winningTickets} 张 / 中奖金额 {game.totalPrize} 元
      </p>
      <p>
        投入 {game.totalInvestment} 元 / 盈亏 {formatSigned(game.netProfit)} 元
      </p>
    </section>
  );
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
