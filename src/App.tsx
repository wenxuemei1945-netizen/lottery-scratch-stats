import { BarChart3, Home, List, QrCode, Upload } from "lucide-react";
import { useState } from "react";
import { useLotteryData } from "./hooks/useLotteryData";
import { BackupPage } from "./pages/BackupPage";
import { HomePage } from "./pages/HomePage";
import { ScanPage } from "./pages/ScanPage";
import { StatsPage } from "./pages/StatsPage";
import { TicketsPage } from "./pages/TicketsPage";

type Tab = "home" | "scan" | "tickets" | "stats" | "backup";

const tabs = [
  { id: "home" as const, label: "首页", icon: Home },
  { id: "scan" as const, label: "扫码", icon: QrCode },
  { id: "tickets" as const, label: "彩票", icon: List },
  { id: "stats" as const, label: "统计", icon: BarChart3 },
  { id: "backup" as const, label: "备份", icon: Upload },
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const { tickets } = useLotteryData();

  return (
    <main className="app-shell">
      <div className="app-content">
        {activeTab === "home" && <HomePage tickets={tickets} />}
        {activeTab === "scan" && <ScanPage />}
        {activeTab === "tickets" && <TicketsPage />}
        {activeTab === "stats" && <StatsPage />}
        {activeTab === "backup" && <BackupPage />}
      </div>
      <nav className="bottom-nav" aria-label="主导航">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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
