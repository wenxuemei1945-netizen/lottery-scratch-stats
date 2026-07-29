import { BarChart3, Home, List, PencilLine, Upload } from "lucide-react";
import { useState } from "react";
import { useLotteryData } from "./hooks/useLotteryData";
import { BackupPage } from "./pages/BackupPage";
import { HomePage } from "./pages/HomePage";
import { ScanPage } from "./pages/ScanPage";
import { StatsPage } from "./pages/StatsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketsPage } from "./pages/TicketsPage";

type Tab = "home" | "scan" | "tickets" | "stats" | "backup";

const tabs = [
  { id: "home" as const, label: "首页", icon: Home },
  { id: "scan" as const, label: "入库", icon: PencilLine },
  { id: "tickets" as const, label: "票据", icon: List },
  { id: "stats" as const, label: "统计", icon: BarChart3 },
  { id: "backup" as const, label: "备份", icon: Upload },
];

function LoadingState() {
  return (
    <section className="page state-panel" role="status" aria-live="polite">
      <h1>彩票统计</h1>
      <p>正在加载彩票数据</p>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="page state-panel" role="alert">
      <h1>数据加载失败</h1>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        重试
      </button>
    </section>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { tickets, games, loading, error, reload } = useLotteryData();

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId);

  function handleTabClick(tab: Tab) {
    setSelectedTicketId(null);
    setActiveTab(tab);
  }

  let content;

  if (loading) {
    content = <LoadingState />;
  } else if (error) {
    content = <ErrorState message={error} onRetry={() => void reload()} />;
  } else if (selectedTicket) {
    content = (
      <TicketDetailPage
        ticket={selectedTicket}
        onSaved={reload}
        onDeleted={reload}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  } else {
    content =
      activeTab === "home" ? (
        <HomePage tickets={tickets} />
      ) : activeTab === "scan" ? (
        <ScanPage games={games} onSaved={reload} />
      ) : activeTab === "tickets" ? (
        <TicketsPage tickets={tickets} onOpenTicket={setSelectedTicketId} onChanged={reload} />
      ) : activeTab === "stats" ? (
        <StatsPage tickets={tickets} />
      ) : (
        <BackupPage onImported={reload} />
      );
  }

  return (
    <main className="app-shell">
      <div className="app-content">{content}</div>
      <nav className="bottom-nav" aria-label="主导航">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              type="button"
              onClick={() => handleTabClick(tab.id)}
            >
              <Icon aria-hidden="true" size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
