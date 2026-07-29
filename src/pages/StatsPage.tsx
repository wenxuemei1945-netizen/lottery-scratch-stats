import { calculateGameStats, calculateOverallStats, calculatePackStats } from "../domain/stats";
import type { Ticket } from "../domain/types";

export function StatsPage({ tickets }: { tickets: Ticket[] }) {
  const overall = calculateOverallStats(tickets);
  const gameStats = calculateGameStats(tickets);
  const packStats = calculatePackStats(tickets);

  return (
    <section className="page">
      <h1>统计报表</h1>
      <div className="report-summary">
        <span>总投入 {overall.totalInvestment} 元</span>
        <span>回报率 {Math.round(overall.returnRate * 100)}%</span>
      </div>
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
        {gameStats.map((game) => (
          <article className="list-row" key={game.gameId}>
            <div>
              <strong>{game.gameName}</strong>
              <span>
                {game.totalTickets} 张 / 中奖率 {Math.round(game.winRate * 100)}%
              </span>
            </div>
            <strong className={game.netProfit >= 0 ? "money-good" : "money-bad"}>{formatSigned(game.netProfit)} 元</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
