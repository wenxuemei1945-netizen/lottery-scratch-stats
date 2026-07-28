import { calculateOverallStats } from "../domain/stats";
import type { Ticket } from "../domain/types";

export function HomePage({ tickets }: { tickets: Ticket[] }) {
  const stats = calculateOverallStats(tickets);

  return (
    <section className="page">
      <h1>刮刮乐统计</h1>
      <div className="stat-grid">
        <StatCard label="总投入" value={`${stats.totalInvestment} 元`} />
        <StatCard label="总中奖" value={`${stats.totalPrize} 元`} />
        <StatCard label="净盈亏" value={`${formatSigned(stats.netProfit)} 元`} tone={stats.netProfit >= 0 ? "good" : "bad"} />
        <StatCard label="中奖率" value={`${Math.round(stats.winRate * 100)}%`} />
      </div>
      <div className="summary-line">未刮 {stats.unopenedTickets} 张</div>
      <div className="summary-line">已刮 {stats.scratchedTickets} 张</div>
    </section>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <article className={`stat-card ${tone ?? ""}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
