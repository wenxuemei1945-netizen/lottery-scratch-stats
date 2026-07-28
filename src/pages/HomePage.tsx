import type { Ticket } from "../domain/types";

export function HomePage({ tickets }: { tickets: Ticket[] }) {
  return (
    <section className="page">
      <h1>刮刮乐统计</h1>
      <p>已记录 {tickets.length} 张彩票</p>
    </section>
  );
}
