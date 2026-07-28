import { BarChart3, Home, List, QrCode, Upload } from "lucide-react";
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
  { id: "home" as const, label: "Home", icon: Home },
  { id: "scan" as const, label: "Scan", icon: QrCode },
  { id: "tickets" as const, label: "Tickets", icon: List },
  { id: "stats" as const, label: "Stats", icon: BarChart3 },
  { id: "backup" as const, label: "Backup", icon: Upload },
];

function LoadingState() {
  return (
    <section className="page state-panel" role="status" aria-live="polite">
      <h1>Lottery stats</h1>
      <p>Loading ticket data</p>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="page state-panel" role="alert">
      <h1>Data load failed</h1>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Retry
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
        <TicketsPage tickets={tickets} onOpenTicket={setSelectedTicketId} />
      ) : activeTab === "stats" ? (
        <StatsPage tickets={tickets} />
      ) : (
        <BackupPage />
      );
  }

  return (
    <main className="app-shell">
      <div className="app-content">{content}</div>
      <nav className="bottom-nav" aria-label="Primary navigation">
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
