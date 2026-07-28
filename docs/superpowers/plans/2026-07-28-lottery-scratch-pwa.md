# 福利彩票刮刮乐 PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free, personal-use mobile PWA for scanning, storing, tracking, and statistically summarizing福利彩票刮刮乐彩票 records.

**Architecture:** Use a React + Vite single-page PWA with local-first IndexedDB persistence. Keep ticket domain logic, persistence, scanner integration, backup import/export, and UI routes separated so each part can be tested independently.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, fake-indexeddb, idb, html5-qrcode, vite-plugin-pwa.

## Global Constraints

- First version is a PWA mobile web app for Android and iPhone browsers.
- No user login, cloud sync, server database, paid OCR, paid API, iOS package, or Android APK.
- Store all ticket data locally in the browser using IndexedDB.
- Camera scanning must have manual entry fallback.
- Every ticket status must be exactly one of `unopened`, `lost`, `won`, or `redeemed`.
- `unopened` tickets count toward total investment and inventory, but do not count toward win-rate denominator.
- Duplicate ticket codes must not be saved twice.
- Backup and restore use JSON.
- Production camera usage requires HTTPS.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `vite.config.ts`: Vite, Vitest, React, and PWA configuration.
- `index.html`: app shell mount point.
- `src/main.tsx`: React app bootstrap.
- `src/App.tsx`: route layout and bottom navigation.
- `src/styles.css`: mobile-first app styling.
- `src/domain/types.ts`: shared domain types.
- `src/domain/ticketStatus.ts`: status labels, transitions, and status helpers.
- `src/domain/stats.ts`: pure statistic calculations.
- `src/domain/backup.ts`: backup validation and serialization helpers.
- `src/storage/db.ts`: IndexedDB schema and low-level database access.
- `src/storage/ticketRepository.ts`: ticket and game CRUD operations.
- `src/scanner/Scanner.tsx`: camera scanner wrapper with manual fallback.
- `src/pages/HomePage.tsx`: dashboard statistics.
- `src/pages/ScanPage.tsx`: scan and create ticket flow.
- `src/pages/TicketsPage.tsx`: ticket list, filters, and search.
- `src/pages/TicketDetailPage.tsx`: status updates and prize entry.
- `src/pages/StatsPage.tsx`: overall and per-game statistics.
- `src/pages/BackupPage.tsx`: JSON export and import.
- `src/test/testData.ts`: reusable test fixtures.
- `src/test/setup.ts`: Vitest DOM and IndexedDB setup.
- `src/**/*.test.ts` and `src/**/*.test.tsx`: focused unit/component tests.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes: none.
- Produces: React app bootstrap with `npm run dev`, `npm run build`, and `npm test`.

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "lottery-scratch-pwa",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "html5-qrcode": "^2.3.8",
    "idb": "^8.0.0",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "vite-plugin-pwa": "^0.20.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create TypeScript and Vite configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"]
  }
});
```

- [ ] **Step 3: Create a minimal React shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>刮刮乐统计</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>刮刮乐统计</h1>
      </header>
      <section className="empty-state">PWA 初始化完成</section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #172026;
  background: #f6f7f2;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 16px;
}

.app-header h1 {
  margin: 0 0 16px;
  font-size: 24px;
}

.empty-state {
  border: 1px solid #d8ddd2;
  border-radius: 8px;
  padding: 16px;
  background: #ffffff;
}
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
```

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the initial shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "刮刮乐统计" })).toBeInTheDocument();
    expect(screen.getByText("PWA 初始化完成")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and install exits successfully.

- [ ] **Step 5: Verify scaffold**

Run:

```bash
npm run build
npm test
```

Expected: build passes; Vitest runs `src/App.test.tsx` and passes.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src
git commit -m "chore: scaffold lottery pwa"
```

---

### Task 2: Domain Types and Status Rules

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/ticketStatus.ts`
- Create: `src/domain/ticketStatus.test.ts`

**Interfaces:**
- Consumes: none.
- Produces:
  - `type TicketStatus = "unopened" | "lost" | "won" | "redeemed"`
  - `interface Ticket`
  - `interface Game`
  - `const TICKET_STATUS_LABELS: Record<TicketStatus, string>`
  - `function canTransitionTicketStatus(from: TicketStatus, to: TicketStatus): boolean`
  - `function isScratchedStatus(status: TicketStatus): boolean`

- [ ] **Step 1: Write failing tests for status rules**

Create `src/domain/ticketStatus.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canTransitionTicketStatus, isScratchedStatus, TICKET_STATUS_LABELS } from "./ticketStatus";

describe("ticket status rules", () => {
  it("labels all ticket states in Chinese", () => {
    expect(TICKET_STATUS_LABELS).toEqual({
      unopened: "未刮开",
      lost: "已刮未中奖",
      won: "已中奖",
      redeemed: "已兑奖"
    });
  });

  it("allows the intended status transitions", () => {
    expect(canTransitionTicketStatus("unopened", "lost")).toBe(true);
    expect(canTransitionTicketStatus("unopened", "won")).toBe(true);
    expect(canTransitionTicketStatus("won", "redeemed")).toBe(true);
  });

  it("treats unchanged states as allowed corrections", () => {
    expect(canTransitionTicketStatus("lost", "lost")).toBe(true);
  });

  it("blocks invalid direct transitions", () => {
    expect(canTransitionTicketStatus("lost", "redeemed")).toBe(false);
    expect(canTransitionTicketStatus("redeemed", "unopened")).toBe(false);
  });

  it("knows which states are scratched", () => {
    expect(isScratchedStatus("unopened")).toBe(false);
    expect(isScratchedStatus("lost")).toBe(true);
    expect(isScratchedStatus("won")).toBe(true);
    expect(isScratchedStatus("redeemed")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/domain/ticketStatus.test.ts
```

Expected: FAIL because `src/domain/ticketStatus.ts` does not exist.

- [ ] **Step 3: Implement domain types and status rules**

Create `src/domain/types.ts`:

```ts
export type TicketStatus = "unopened" | "lost" | "won" | "redeemed";

export interface Ticket {
  id: string;
  code: string;
  gameId: string;
  gameName: string;
  price: number;
  status: TicketStatus;
  prizeAmount: number;
  purchasedAt: string;
  scratchedAt?: string;
  redeemedAt?: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface Game {
  id: string;
  name: string;
  price: number;
  topPrize?: number;
  barcodePrefixPatterns?: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Create `src/domain/ticketStatus.ts`:

```ts
import type { TicketStatus } from "./types";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  unopened: "未刮开",
  lost: "已刮未中奖",
  won: "已中奖",
  redeemed: "已兑奖"
};

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  unopened: ["unopened", "lost", "won"],
  lost: ["lost"],
  won: ["won", "redeemed"],
  redeemed: ["redeemed"]
};

export function canTransitionTicketStatus(from: TicketStatus, to: TicketStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function isScratchedStatus(status: TicketStatus): boolean {
  return status !== "unopened";
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/domain/ticketStatus.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat: add ticket status domain rules"
```

---

### Task 3: Statistics Engine

**Files:**
- Create: `src/domain/stats.ts`
- Create: `src/domain/stats.test.ts`
- Create: `src/test/testData.ts`

**Interfaces:**
- Consumes: `Ticket`, `Game`, and `isScratchedStatus`.
- Produces:
  - `interface OverallStats`
  - `interface GameStats`
  - `function calculateOverallStats(tickets: Ticket[]): OverallStats`
  - `function calculateGameStats(tickets: Ticket[]): GameStats[]`

- [ ] **Step 1: Create reusable test data**

Create `src/test/testData.ts`:

```ts
import type { Game, Ticket, TicketStatus } from "../domain/types";

export function makeGame(overrides: Partial<Game> = {}): Game {
  const now = "2026-07-28T00:00:00.000Z";
  return {
    id: "game-1",
    name: "好运十倍",
    price: 10,
    topPrize: 400000,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  const now = "2026-07-28T00:00:00.000Z";
  const status: TicketStatus = overrides.status ?? "unopened";
  return {
    id: "ticket-1",
    code: "J0353-26082-0564563-133-3",
    gameId: "game-1",
    gameName: "好运十倍",
    price: 10,
    status,
    prizeAmount: status === "won" || status === "redeemed" ? 20 : 0,
    purchasedAt: "2026-07-28",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}
```

- [ ] **Step 2: Write failing statistics tests**

Create `src/domain/stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeTicket } from "../test/testData";
import { calculateGameStats, calculateOverallStats } from "./stats";

describe("statistics", () => {
  it("counts unopened tickets as investment but excludes them from win-rate denominator", () => {
    const tickets = [
      makeTicket({ id: "1", code: "A", status: "unopened", prizeAmount: 0 }),
      makeTicket({ id: "2", code: "B", status: "lost", prizeAmount: 0 }),
      makeTicket({ id: "3", code: "C", status: "won", prizeAmount: 50 })
    ];

    expect(calculateOverallStats(tickets)).toEqual({
      totalTickets: 3,
      unopenedTickets: 1,
      scratchedTickets: 2,
      winningTickets: 1,
      totalInvestment: 30,
      totalPrize: 50,
      netProfit: 20,
      winRate: 0.5,
      returnRate: 50 / 30
    });
  });

  it("groups statistics by game", () => {
    const tickets = [
      makeTicket({ id: "1", code: "A", gameId: "g1", gameName: "好运十倍", price: 10, status: "won", prizeAmount: 20 }),
      makeTicket({ id: "2", code: "B", gameId: "g2", gameName: "喜相逢", price: 20, status: "lost", prizeAmount: 0 })
    ];

    expect(calculateGameStats(tickets)).toEqual([
      expect.objectContaining({ gameId: "g1", gameName: "好运十倍", totalInvestment: 10, totalPrize: 20, netProfit: 10 }),
      expect.objectContaining({ gameId: "g2", gameName: "喜相逢", totalInvestment: 20, totalPrize: 0, netProfit: -20 })
    ]);
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
npm test -- src/domain/stats.test.ts
```

Expected: FAIL because `src/domain/stats.ts` does not exist.

- [ ] **Step 4: Implement statistics calculation**

Create `src/domain/stats.ts`:

```ts
import { isScratchedStatus } from "./ticketStatus";
import type { Ticket } from "./types";

export interface OverallStats {
  totalTickets: number;
  unopenedTickets: number;
  scratchedTickets: number;
  winningTickets: number;
  totalInvestment: number;
  totalPrize: number;
  netProfit: number;
  winRate: number;
  returnRate: number;
}

export interface GameStats extends OverallStats {
  gameId: string;
  gameName: string;
}

export function calculateOverallStats(tickets: Ticket[]): OverallStats {
  const totalTickets = tickets.length;
  const unopenedTickets = tickets.filter((ticket) => ticket.status === "unopened").length;
  const scratchedTickets = tickets.filter((ticket) => isScratchedStatus(ticket.status)).length;
  const winningTickets = tickets.filter((ticket) => ticket.status === "won" || ticket.status === "redeemed").length;
  const totalInvestment = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
  const totalPrize = tickets.reduce((sum, ticket) => sum + ticket.prizeAmount, 0);
  const netProfit = totalPrize - totalInvestment;

  return {
    totalTickets,
    unopenedTickets,
    scratchedTickets,
    winningTickets,
    totalInvestment,
    totalPrize,
    netProfit,
    winRate: scratchedTickets === 0 ? 0 : winningTickets / scratchedTickets,
    returnRate: totalInvestment === 0 ? 0 : totalPrize / totalInvestment
  };
}

export function calculateGameStats(tickets: Ticket[]): GameStats[] {
  const grouped = new Map<string, Ticket[]>();

  for (const ticket of tickets) {
    const existing = grouped.get(ticket.gameId) ?? [];
    existing.push(ticket);
    grouped.set(ticket.gameId, existing);
  }

  return [...grouped.entries()].map(([gameId, gameTickets]) => ({
    gameId,
    gameName: gameTickets[0]?.gameName ?? "",
    ...calculateOverallStats(gameTickets)
  }));
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- src/domain/stats.test.ts src/domain/ticketStatus.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain src/test
git commit -m "feat: add lottery statistics engine"
```

---

### Task 4: IndexedDB Repository

**Files:**
- Create: `src/storage/db.ts`
- Create: `src/storage/ticketRepository.ts`
- Create: `src/storage/ticketRepository.test.ts`

**Interfaces:**
- Consumes: `Ticket`, `Game`.
- Produces:
  - `function resetDatabase(): Promise<void>`
  - `function listTickets(): Promise<Ticket[]>`
  - `function saveTicket(ticket: Ticket): Promise<Ticket>`
  - `function updateTicket(ticket: Ticket): Promise<Ticket>`
  - `function getTicketById(id: string): Promise<Ticket | undefined>`
  - `function getTicketByCode(code: string): Promise<Ticket | undefined>`
  - `function listGames(): Promise<Game[]>`
  - `function saveGame(game: Game): Promise<Game>`

- [ ] **Step 1: Write failing repository tests**

Create `src/storage/ticketRepository.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { makeGame, makeTicket } from "../test/testData";
import { getTicketByCode, listGames, listTickets, resetDatabase, saveGame, saveTicket } from "./ticketRepository";

describe("ticket repository", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("saves and lists games", async () => {
    await saveGame(makeGame({ id: "game-1", name: "好运十倍" }));

    expect(await listGames()).toEqual([expect.objectContaining({ id: "game-1", name: "好运十倍" })]);
  });

  it("saves tickets and finds them by code", async () => {
    const ticket = makeTicket({ id: "ticket-1", code: "J0353-26082-0564563-133-3" });

    await saveTicket(ticket);

    expect(await listTickets()).toHaveLength(1);
    expect(await getTicketByCode("J0353-26082-0564563-133-3")).toEqual(ticket);
  });

  it("rejects duplicate ticket codes", async () => {
    await saveTicket(makeTicket({ id: "ticket-1", code: "A" }));

    await expect(saveTicket(makeTicket({ id: "ticket-2", code: "A" }))).rejects.toThrow("彩票编号已存在");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/storage/ticketRepository.test.ts
```

Expected: FAIL because repository files do not exist.

- [ ] **Step 3: Implement IndexedDB access**

Create `src/storage/db.ts`:

```ts
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Game, Ticket } from "../domain/types";

interface LotteryDb extends DBSchema {
  tickets: {
    key: string;
    value: Ticket;
    indexes: { "by-code": string; "by-game": string; "by-status": string };
  };
  games: {
    key: string;
    value: Game;
    indexes: { "by-name": string };
  };
}

const DB_NAME = "lottery-scratch-stats";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LotteryDb>> | undefined;

export function getDatabase() {
  dbPromise ??= openDB<LotteryDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const ticketStore = db.createObjectStore("tickets", { keyPath: "id" });
      ticketStore.createIndex("by-code", "code", { unique: true });
      ticketStore.createIndex("by-game", "gameId");
      ticketStore.createIndex("by-status", "status");

      const gameStore = db.createObjectStore("games", { keyPath: "id" });
      gameStore.createIndex("by-name", "name", { unique: false });
    }
  });

  return dbPromise;
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await Promise.all([db.clear("tickets"), db.clear("games")]);
}
```

Create `src/storage/ticketRepository.ts`:

```ts
import type { Game, Ticket } from "../domain/types";
import { getDatabase, resetDatabase as clearDatabase } from "./db";

export async function resetDatabase(): Promise<void> {
  await clearDatabase();
}

export async function listTickets(): Promise<Ticket[]> {
  const db = await getDatabase();
  return db.getAll("tickets");
}

export async function getTicketById(id: string): Promise<Ticket | undefined> {
  const db = await getDatabase();
  return db.get("tickets", id);
}

export async function getTicketByCode(code: string): Promise<Ticket | undefined> {
  const db = await getDatabase();
  return db.getFromIndex("tickets", "by-code", code);
}

export async function saveTicket(ticket: Ticket): Promise<Ticket> {
  const db = await getDatabase();
  const existing = await getTicketByCode(ticket.code);

  if (existing && existing.id !== ticket.id) {
    throw new Error("彩票编号已存在");
  }

  await db.put("tickets", ticket);
  return ticket;
}

export async function updateTicket(ticket: Ticket): Promise<Ticket> {
  const db = await getDatabase();
  await db.put("tickets", ticket);
  return ticket;
}

export async function listGames(): Promise<Game[]> {
  const db = await getDatabase();
  return db.getAll("games");
}

export async function saveGame(game: Game): Promise<Game> {
  const db = await getDatabase();
  await db.put("games", game);
  return game;
}
```

- [ ] **Step 4: Run repository tests**

Run:

```bash
npm test -- src/storage/ticketRepository.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage
git commit -m "feat: persist lottery data locally"
```

---

### Task 5: Backup Import and Export

**Files:**
- Create: `src/domain/backup.ts`
- Create: `src/domain/backup.test.ts`

**Interfaces:**
- Consumes: `Ticket`, `Game`.
- Produces:
  - `interface AppBackup`
  - `function createBackup(games: Game[], tickets: Ticket[], exportedAt?: string): AppBackup`
  - `function parseBackupJson(json: string): AppBackup`

- [ ] **Step 1: Write failing backup tests**

Create `src/domain/backup.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeGame, makeTicket } from "../test/testData";
import { createBackup, parseBackupJson } from "./backup";

describe("backup helpers", () => {
  it("creates versioned backups", () => {
    const backup = createBackup([makeGame()], [makeTicket()], "2026-07-28T00:00:00.000Z");

    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBe("2026-07-28T00:00:00.000Z");
    expect(backup.games).toHaveLength(1);
    expect(backup.tickets).toHaveLength(1);
  });

  it("parses valid backup JSON", () => {
    const backup = createBackup([makeGame()], [makeTicket()], "2026-07-28T00:00:00.000Z");

    expect(parseBackupJson(JSON.stringify(backup))).toEqual(backup);
  });

  it("rejects invalid backup JSON", () => {
    expect(() => parseBackupJson("{bad json")).toThrow("备份文件不是有效的 JSON");
    expect(() => parseBackupJson(JSON.stringify({ version: 2, games: [], tickets: [] }))).toThrow("备份文件版本不支持");
    expect(() => parseBackupJson(JSON.stringify({ version: 1, games: {}, tickets: [] }))).toThrow("备份文件格式无效");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/domain/backup.test.ts
```

Expected: FAIL because `src/domain/backup.ts` does not exist.

- [ ] **Step 3: Implement backup helpers**

Create `src/domain/backup.ts`:

```ts
import type { Game, Ticket } from "./types";

export interface AppBackup {
  version: 1;
  exportedAt: string;
  games: Game[];
  tickets: Ticket[];
}

export function createBackup(games: Game[], tickets: Ticket[], exportedAt = new Date().toISOString()): AppBackup {
  return {
    version: 1,
    exportedAt,
    games,
    tickets
  };
}

export function parseBackupJson(json: string): AppBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("备份文件不是有效的 JSON");
  }

  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error("备份文件版本不支持");
  }

  if (!Array.isArray(parsed.games) || !Array.isArray(parsed.tickets) || typeof parsed.exportedAt !== "string") {
    throw new Error("备份文件格式无效");
  }

  return parsed as AppBackup;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
```

- [ ] **Step 4: Run backup tests**

Run:

```bash
npm test -- src/domain/backup.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/backup.ts src/domain/backup.test.ts
git commit -m "feat: add backup file helpers"
```

---

### Task 6: App Navigation and Repository Hook

**Files:**
- Create: `src/hooks/useLotteryData.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/ScanPage.tsx`
- Create: `src/pages/TicketsPage.tsx`
- Create: `src/pages/StatsPage.tsx`
- Create: `src/pages/BackupPage.tsx`

**Interfaces:**
- Consumes: repository functions from Task 4.
- Produces:
  - `function useLotteryData(): { tickets: Ticket[]; games: Game[]; loading: boolean; reload: () => Promise<void> }`
  - tab navigation values: `home`, `scan`, `tickets`, `stats`, `backup`

- [ ] **Step 1: Write failing navigation test**

Replace `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "./storage/ticketRepository";
import { App } from "./App";

describe("App navigation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("starts on the home page and navigates to ticket list", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "刮刮乐统计" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "彩票" }));

    expect(screen.getByRole("heading", { name: "彩票列表" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because navigation and pages are not implemented.

- [ ] **Step 3: Implement data hook and placeholder pages**

Create `src/hooks/useLotteryData.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import type { Game, Ticket } from "../domain/types";
import { listGames, listTickets } from "../storage/ticketRepository";

export function useLotteryData() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [nextTickets, nextGames] = await Promise.all([listTickets(), listGames()]);
    setTickets(nextTickets);
    setGames(nextGames);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tickets, games, loading, reload };
}
```

Create `src/pages/HomePage.tsx`:

```tsx
import type { Ticket } from "../domain/types";

export function HomePage({ tickets }: { tickets: Ticket[] }) {
  return (
    <section className="page">
      <h1>刮刮乐统计</h1>
      <p>已记录 {tickets.length} 张彩票</p>
    </section>
  );
}
```

Create `src/pages/ScanPage.tsx`:

```tsx
export function ScanPage() {
  return (
    <section className="page">
      <h1>扫码入库</h1>
    </section>
  );
}
```

Create `src/pages/TicketsPage.tsx`:

```tsx
export function TicketsPage() {
  return (
    <section className="page">
      <h1>彩票列表</h1>
    </section>
  );
}
```

Create `src/pages/StatsPage.tsx`:

```tsx
export function StatsPage() {
  return (
    <section className="page">
      <h1>统计报表</h1>
    </section>
  );
}
```

Create `src/pages/BackupPage.tsx`:

```tsx
export function BackupPage() {
  return (
    <section className="page">
      <h1>备份恢复</h1>
    </section>
  );
}
```

Modify `src/App.tsx`:

```tsx
import { BarChart3, Home, List, QrCode, Upload } from "lucide-react";
import { useState } from "react";
import { BackupPage } from "./pages/BackupPage";
import { HomePage } from "./pages/HomePage";
import { ScanPage } from "./pages/ScanPage";
import { StatsPage } from "./pages/StatsPage";
import { TicketsPage } from "./pages/TicketsPage";
import { useLotteryData } from "./hooks/useLotteryData";

type Tab = "home" | "scan" | "tickets" | "stats" | "backup";

const tabs = [
  { id: "home" as const, label: "首页", icon: Home },
  { id: "scan" as const, label: "扫码", icon: QrCode },
  { id: "tickets" as const, label: "彩票", icon: List },
  { id: "stats" as const, label: "统计", icon: BarChart3 },
  { id: "backup" as const, label: "备份", icon: Upload }
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const data = useLotteryData();

  return (
    <main className="app-shell">
      <div className="app-content">
        {activeTab === "home" && <HomePage tickets={data.tickets} />}
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
```

Append to `src/styles.css`:

```css
.app-content {
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: 88px;
}

.page h1 {
  margin: 0 0 16px;
  font-size: 24px;
}

.bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid #d8ddd2;
  background: #ffffff;
}

.bottom-nav button {
  display: grid;
  place-items: center;
  gap: 4px;
  min-height: 52px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #53605a;
}

.bottom-nav button.active {
  background: #e8f2e2;
  color: #1d6b3b;
}

.bottom-nav span {
  font-size: 12px;
}
```

- [ ] **Step 4: Run navigation test**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add mobile app navigation"
```

---

### Task 7: Dashboard and Statistics Pages

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/StatsPage.tsx`
- Modify: `src/styles.css`
- Create: `src/pages/HomePage.test.tsx`
- Create: `src/pages/StatsPage.test.tsx`

**Interfaces:**
- Consumes: `calculateOverallStats`, `calculateGameStats`, `Ticket`.
- Produces: visible stat cards and per-game rows.

- [ ] **Step 1: Write failing dashboard test**

Create `src/pages/HomePage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeTicket } from "../test/testData";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows key summary numbers", () => {
    render(
      <HomePage
        tickets={[
          makeTicket({ id: "1", code: "A", status: "unopened", prizeAmount: 0 }),
          makeTicket({ id: "2", code: "B", status: "won", prizeAmount: 50 })
        ]}
      />
    );

    expect(screen.getByText("总投入")).toBeInTheDocument();
    expect(screen.getByText("20 元")).toBeInTheDocument();
    expect(screen.getByText("净盈亏")).toBeInTheDocument();
    expect(screen.getByText("+30 元")).toBeInTheDocument();
    expect(screen.getByText("未刮 1 张")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write failing stats page test**

Create `src/pages/StatsPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeTicket } from "../test/testData";
import { StatsPage } from "./StatsPage";

describe("StatsPage", () => {
  it("shows per-game statistics", () => {
    render(
      <StatsPage
        tickets={[
          makeTicket({ id: "1", code: "A", gameId: "g1", gameName: "好运十倍", price: 10, status: "won", prizeAmount: 20 }),
          makeTicket({ id: "2", code: "B", gameId: "g2", gameName: "喜相逢", price: 20, status: "lost", prizeAmount: 0 })
        ]}
      />
    );

    expect(screen.getByText("好运十倍")).toBeInTheDocument();
    expect(screen.getByText("+10 元")).toBeInTheDocument();
    expect(screen.getByText("喜相逢")).toBeInTheDocument();
    expect(screen.getByText("-20 元")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
npm test -- src/pages/HomePage.test.tsx src/pages/StatsPage.test.tsx
```

Expected: FAIL because current pages do not render the expected statistics.

- [ ] **Step 4: Implement statistics UI**

Modify `src/pages/HomePage.tsx`:

```tsx
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
    <article className={`stat-card ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
```

Modify `src/pages/StatsPage.tsx`:

```tsx
import { calculateGameStats, calculateOverallStats } from "../domain/stats";
import type { Ticket } from "../domain/types";

export function StatsPage({ tickets }: { tickets: Ticket[] }) {
  const overall = calculateOverallStats(tickets);
  const gameStats = calculateGameStats(tickets);

  return (
    <section className="page">
      <h1>统计报表</h1>
      <div className="report-summary">
        <span>总投入 {overall.totalInvestment} 元</span>
        <span>回报率 {Math.round(overall.returnRate * 100)}%</span>
      </div>
      <div className="list-stack">
        {gameStats.map((game) => (
          <article className="list-row" key={game.gameId}>
            <div>
              <strong>{game.gameName}</strong>
              <span>{game.totalTickets} 张 / 中奖率 {Math.round(game.winRate * 100)}%</span>
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
```

Modify `src/App.tsx` so `StatsPage` receives tickets:

```tsx
{activeTab === "stats" && <StatsPage tickets={data.tickets} />}
```

Append to `src/styles.css`:

```css
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  min-height: 92px;
  border: 1px solid #d8ddd2;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.stat-card span,
.list-row span,
.report-summary {
  color: #65716b;
  font-size: 13px;
}

.stat-card strong {
  display: block;
  margin-top: 10px;
  font-size: 22px;
}

.money-good,
.stat-card.good strong {
  color: #177245;
}

.money-bad,
.stat-card.bad strong {
  color: #b6332a;
}

.summary-line {
  margin-top: 12px;
  color: #3f4b45;
}

.report-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.list-stack {
  display: grid;
  gap: 10px;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #d8ddd2;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
}

.list-row div {
  display: grid;
  gap: 4px;
}
```

- [ ] **Step 5: Run page tests**

Run:

```bash
npm test -- src/pages/HomePage.test.tsx src/pages/StatsPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: show lottery statistics"
```

---

### Task 8: Scan and Create Ticket Flow

**Files:**
- Modify: `src/scanner/Scanner.tsx`
- Modify: `src/pages/ScanPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/pages/ScanPage.test.tsx`

**Interfaces:**
- Consumes: `saveTicket`, `saveGame`, `getTicketByCode`, `Game`.
- Produces:
  - `Scanner` component with `onDetected(code: string): void`
  - `ScanPage` props `{ games: Game[]; onSaved: () => Promise<void> }`

- [ ] **Step 1: Write failing scan page test**

Create `src/pages/ScanPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase, getTicketByCode } from "../storage/ticketRepository";
import { makeGame } from "../test/testData";
import { ScanPage } from "./ScanPage";

vi.mock("../scanner/Scanner", () => ({
  Scanner: ({ onDetected }: { onDetected: (code: string) => void }) => (
    <button type="button" onClick={() => onDetected("MOCK-SCANNED-CODE")}>
      模拟扫码
    </button>
  )
}));

describe("ScanPage", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates an unopened ticket from manual code entry", async () => {
    const onSaved = vi.fn();
    render(<ScanPage games={[makeGame()]} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText("彩票编号"), "J0353-26082-0564563-133-3");
    await userEvent.click(screen.getByRole("button", { name: "保存入库" }));

    const ticket = await getTicketByCode("J0353-26082-0564563-133-3");
    expect(ticket).toEqual(expect.objectContaining({ status: "unopened", gameName: "好运十倍", price: 10 }));
    expect(onSaved).toHaveBeenCalled();
  });

  it("fills the code field from scanner detection", async () => {
    render(<ScanPage games={[makeGame()]} onSaved={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "模拟扫码" }));

    expect(screen.getByLabelText("彩票编号")).toHaveValue("MOCK-SCANNED-CODE");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/pages/ScanPage.test.tsx
```

Expected: FAIL because `ScanPage` does not accept props or save records.

- [ ] **Step 3: Implement scanner wrapper**

Create `src/scanner/Scanner.tsx`:

```tsx
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useId, useRef } from "react";

export function Scanner({ onDetected }: { onDetected: (code: string) => void }) {
  const elementId = useId().replace(/:/g, "");
  const hasDetected = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      elementId,
      { fps: 8, qrbox: { width: 240, height: 120 }, rememberLastUsedCamera: true },
      false
    );

    scanner.render(
      (decodedText) => {
        if (!hasDetected.current) {
          hasDetected.current = true;
          onDetected(decodedText.trim());
        }
      },
      () => undefined
    );

    return () => {
      void scanner.clear();
    };
  }, [elementId, onDetected]);

  return <div className="scanner-box" id={elementId} />;
}
```

- [ ] **Step 4: Implement scan form**

Modify `src/pages/ScanPage.tsx`:

```tsx
import { useMemo, useState } from "react";
import type { Game } from "../domain/types";
import { saveGame, saveTicket } from "../storage/ticketRepository";
import { Scanner } from "../scanner/Scanner";

export function ScanPage({ games, onSaved }: { games: Game[]; onSaved: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [gameId, setGameId] = useState(games[0]?.id ?? "default-good-luck-10");
  const [message, setMessage] = useState("");

  const selectedGame = useMemo(
    () => games.find((game) => game.id === gameId) ?? defaultGame(),
    [gameId, games]
  );

  async function handleSave() {
    const cleanCode = code.trim();

    if (!cleanCode) {
      setMessage("请先扫描或输入彩票编号");
      return;
    }

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
      status: "unopened",
      prizeAmount: 0,
      purchasedAt: now.slice(0, 10),
      createdAt: now,
      updatedAt: now
    });

    setCode("");
    setMessage("已保存为未刮开");
    await onSaved();
  }

  return (
    <section className="page">
      <h1>扫码入库</h1>
      <Scanner onDetected={setCode} />
      <label className="field">
        <span>彩票编号</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="扫描失败可手动输入" />
      </label>
      <label className="field">
        <span>票种</span>
        <select value={gameId} onChange={(event) => setGameId(event.target.value)}>
          {[...games, defaultGame()].map((game) => (
            <option key={game.id} value={game.id}>
              {game.name} / {game.price} 元
            </option>
          ))}
        </select>
      </label>
      <button className="primary-button" type="button" onClick={handleSave}>
        保存入库
      </button>
      {message && <p className="message">{message}</p>}
    </section>
  );
}

function defaultGame(): Game {
  const now = new Date().toISOString();
  return {
    id: "default-good-luck-10",
    name: "好运十倍",
    price: 10,
    topPrize: 400000,
    active: true,
    createdAt: now,
    updatedAt: now
  };
}
```

Modify `src/App.tsx` so `ScanPage` receives data:

```tsx
{activeTab === "scan" && <ScanPage games={data.games} onSaved={data.reload} />}
```

Append to `src/styles.css`:

```css
.scanner-box {
  min-height: 180px;
  overflow: hidden;
  border: 1px solid #d8ddd2;
  border-radius: 8px;
  background: #ffffff;
}

.field {
  display: grid;
  gap: 6px;
  margin-top: 14px;
}

.field span {
  color: #52605a;
  font-size: 14px;
}

.field input,
.field select {
  min-height: 44px;
  border: 1px solid #cfd6cb;
  border-radius: 8px;
  padding: 0 12px;
  background: #ffffff;
}

.primary-button {
  width: 100%;
  min-height: 48px;
  margin-top: 16px;
  border: 0;
  border-radius: 8px;
  background: #1d6b3b;
  color: #ffffff;
  font-weight: 700;
}

.message {
  color: #1d6b3b;
}
```

- [ ] **Step 5: Run scan tests**

Run:

```bash
npm test -- src/pages/ScanPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add scan to inventory flow"
```

---

### Task 9: Ticket List and Detail Updates

**Files:**
- Modify: `src/pages/TicketsPage.tsx`
- Create: `src/pages/TicketDetailPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/pages/TicketsPage.test.tsx`
- Create: `src/pages/TicketDetailPage.test.tsx`

**Interfaces:**
- Consumes: `Ticket`, `TICKET_STATUS_LABELS`, `updateTicket`.
- Produces:
  - `TicketsPage` props `{ tickets: Ticket[]; onOpenTicket: (ticketId: string) => void }`
  - `TicketDetailPage` props `{ ticket: Ticket; onSaved: () => Promise<void>; onBack: () => void }`

- [ ] **Step 1: Write failing list test**

Create `src/pages/TicketsPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeTicket } from "../test/testData";
import { TicketsPage } from "./TicketsPage";

describe("TicketsPage", () => {
  it("filters unopened tickets and opens a record", async () => {
    const onOpenTicket = vi.fn();
    render(
      <TicketsPage
        tickets={[
          makeTicket({ id: "1", code: "A", status: "unopened" }),
          makeTicket({ id: "2", code: "B", status: "lost" })
        ]}
        onOpenTicket={onOpenTicket}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText("状态筛选"), "unopened");

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("B")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /A/ }));

    expect(onOpenTicket).toHaveBeenCalledWith("1");
  });
});
```

- [ ] **Step 2: Write failing detail test**

Create `src/pages/TicketDetailPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTicketByCode, resetDatabase, saveTicket } from "../storage/ticketRepository";
import { makeTicket } from "../test/testData";
import { TicketDetailPage } from "./TicketDetailPage";

describe("TicketDetailPage", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("marks a ticket as won with prize amount", async () => {
    const ticket = makeTicket({ id: "1", code: "A", status: "unopened", prizeAmount: 0 });
    await saveTicket(ticket);

    render(<TicketDetailPage ticket={ticket} onSaved={vi.fn()} onBack={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("中奖金额"), "50");
    await userEvent.click(screen.getByRole("button", { name: "标记中奖" }));

    expect(await getTicketByCode("A")).toEqual(expect.objectContaining({ status: "won", prizeAmount: 50 }));
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
npm test -- src/pages/TicketsPage.test.tsx src/pages/TicketDetailPage.test.tsx
```

Expected: FAIL because list filtering and detail page are not implemented.

- [ ] **Step 4: Implement list and detail pages**

Modify `src/pages/TicketsPage.tsx`:

```tsx
import { useMemo, useState } from "react";
import { TICKET_STATUS_LABELS } from "../domain/ticketStatus";
import type { Ticket, TicketStatus } from "../domain/types";

type StatusFilter = "all" | TicketStatus;

export function TicketsPage({ tickets, onOpenTicket }: { tickets: Ticket[]; onOpenTicket: (ticketId: string) => void }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesStatus = status === "all" || ticket.status === status;
        const matchesQuery = ticket.code.includes(query.trim()) || ticket.gameName.includes(query.trim());
        return matchesStatus && matchesQuery;
      }),
    [query, status, tickets]
  );

  return (
    <section className="page">
      <h1>彩票列表</h1>
      <label className="field">
        <span>状态筛选</span>
        <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
          <option value="all">全部</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>搜索编号或票种</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="list-stack">
        {filteredTickets.map((ticket) => (
          <button className="ticket-row" key={ticket.id} type="button" onClick={() => onOpenTicket(ticket.id)}>
            <span>{ticket.code}</span>
            <strong>{ticket.gameName}</strong>
            <small>{TICKET_STATUS_LABELS[ticket.status]} / {ticket.prizeAmount} 元</small>
          </button>
        ))}
      </div>
    </section>
  );
}
```

Create `src/pages/TicketDetailPage.tsx`:

```tsx
import { useState } from "react";
import { TICKET_STATUS_LABELS } from "../domain/ticketStatus";
import type { Ticket, TicketStatus } from "../domain/types";
import { updateTicket } from "../storage/ticketRepository";

export function TicketDetailPage({ ticket, onSaved, onBack }: { ticket: Ticket; onSaved: () => Promise<void>; onBack: () => void }) {
  const [prizeAmount, setPrizeAmount] = useState(ticket.prizeAmount ? String(ticket.prizeAmount) : "");

  async function saveStatus(status: TicketStatus, amount: number) {
    const now = new Date().toISOString();
    await updateTicket({
      ...ticket,
      status,
      prizeAmount: amount,
      scratchedAt: status === "unopened" ? undefined : ticket.scratchedAt ?? now,
      redeemedAt: status === "redeemed" ? now : ticket.redeemedAt,
      updatedAt: now
    });
    await onSaved();
    onBack();
  }

  return (
    <section className="page">
      <button className="ghost-button" type="button" onClick={onBack}>返回</button>
      <h1>{ticket.gameName}</h1>
      <p>{ticket.code}</p>
      <p>当前状态：{TICKET_STATUS_LABELS[ticket.status]}</p>
      <label className="field">
        <span>中奖金额</span>
        <input inputMode="decimal" value={prizeAmount} onChange={(event) => setPrizeAmount(event.target.value)} />
      </label>
      <button className="primary-button" type="button" onClick={() => saveStatus("lost", 0)}>标记未中奖</button>
      <button className="primary-button" type="button" onClick={() => saveStatus("won", Number(prizeAmount || 0))}>标记中奖</button>
      {ticket.status === "won" && (
        <button className="primary-button" type="button" onClick={() => saveStatus("redeemed", ticket.prizeAmount)}>
          标记已兑奖
        </button>
      )}
    </section>
  );
}
```

Modify `src/App.tsx` to hold selected ticket:

```tsx
const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
const selectedTicket = data.tickets.find((ticket) => ticket.id === selectedTicketId);

{selectedTicket ? (
  <TicketDetailPage ticket={selectedTicket} onSaved={data.reload} onBack={() => setSelectedTicketId(null)} />
) : (
  <>
    {activeTab === "home" && <HomePage tickets={data.tickets} />}
    {activeTab === "scan" && <ScanPage games={data.games} onSaved={data.reload} />}
    {activeTab === "tickets" && <TicketsPage tickets={data.tickets} onOpenTicket={setSelectedTicketId} />}
    {activeTab === "stats" && <StatsPage tickets={data.tickets} />}
    {activeTab === "backup" && <BackupPage />}
  </>
)}
```

Append to `src/styles.css`:

```css
.ticket-row {
  display: grid;
  gap: 4px;
  width: 100%;
  border: 1px solid #d8ddd2;
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  background: #ffffff;
}

.ticket-row span {
  font-size: 13px;
  color: #65716b;
}

.ticket-row small {
  color: #65716b;
}

.ghost-button {
  min-height: 40px;
  border: 1px solid #cfd6cb;
  border-radius: 8px;
  background: #ffffff;
}
```

- [ ] **Step 5: Run list and detail tests**

Run:

```bash
npm test -- src/pages/TicketsPage.test.tsx src/pages/TicketDetailPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: manage scratch ticket statuses"
```

---

### Task 10: Backup Page

**Files:**
- Modify: `src/pages/BackupPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/storage/ticketRepository.ts`
- Create: `src/pages/BackupPage.test.tsx`

**Interfaces:**
- Consumes: `createBackup`, `parseBackupJson`, `listGames`, `listTickets`, `saveGame`, `saveTicket`, `resetDatabase`.
- Produces:
  - `BackupPage` props `{ onImported: () => Promise<void> }`
  - repository function `replaceAllData(games: Game[], tickets: Ticket[]): Promise<void>`

- [ ] **Step 1: Write failing backup page test**

Create `src/pages/BackupPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBackup } from "../domain/backup";
import { listTickets, resetDatabase } from "../storage/ticketRepository";
import { makeGame, makeTicket } from "../test/testData";
import { BackupPage } from "./BackupPage";

describe("BackupPage", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("imports backup JSON", async () => {
    const backup = createBackup([makeGame()], [makeTicket({ code: "A" })], "2026-07-28T00:00:00.000Z");
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    const onImported = vi.fn();

    render(<BackupPage onImported={onImported} />);

    await userEvent.upload(screen.getByLabelText("导入 JSON 备份"), file);

    expect(await listTickets()).toHaveLength(1);
    expect(onImported).toHaveBeenCalled();
    expect(screen.getByText("导入完成")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/pages/BackupPage.test.tsx
```

Expected: FAIL because import behavior is not implemented.

- [ ] **Step 3: Add replace-all repository operation**

Append to `src/storage/ticketRepository.ts`:

```ts
export async function replaceAllData(games: Game[], tickets: Ticket[]): Promise<void> {
  await resetDatabase();

  for (const game of games) {
    await saveGame(game);
  }

  for (const ticket of tickets) {
    await saveTicket(ticket);
  }
}
```

- [ ] **Step 4: Implement backup page**

Modify `src/pages/BackupPage.tsx`:

```tsx
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
    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;
    const backup = parseBackupJson(await file.text());
    await replaceAllData(backup.games, backup.tickets);
    await onImported();
    setMessage("导入完成");
  }

  return (
    <section className="page">
      <h1>备份恢复</h1>
      <button className="primary-button" type="button" onClick={exportBackup}>导出 JSON 备份</button>
      <label className="field">
        <span>导入 JSON 备份</span>
        <input type="file" accept="application/json" onChange={(event) => void importBackup(event.target.files?.[0])} />
      </label>
      {message && <p className="message">{message}</p>}
    </section>
  );
}
```

Modify `src/App.tsx`:

```tsx
{activeTab === "backup" && <BackupPage onImported={data.reload} />}
```

- [ ] **Step 5: Run backup tests**

Run:

```bash
npm test -- src/pages/BackupPage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add local backup restore"
```

---

### Task 11: PWA Offline Setup

**Files:**
- Modify: `vite.config.ts`
- Create: `public/pwa-192.png`
- Create: `public/pwa-512.png`
- Modify: `index.html`

**Interfaces:**
- Consumes: Vite app.
- Produces: installable PWA manifest and service worker generated at build time.

- [ ] **Step 1: Add PWA plugin configuration**

Modify `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "刮刮乐统计",
        short_name: "刮刮乐",
        description: "个人自用福利彩票刮刮乐统计工具",
        theme_color: "#1d6b3b",
        background_color: "#f6f7f2",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"]
      }
    })
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"]
  }
});
```

- [ ] **Step 2: Add app meta tags**

Modify `index.html` `<head>`:

```html
<meta name="theme-color" content="#1d6b3b" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="刮刮乐统计" />
```

- [ ] **Step 3: Create PNG icons**

Create simple 192 and 512 PNG app icons at:

```text
public/pwa-192.png
public/pwa-512.png
```

Run this script from the repository root to generate valid PNG files:

```bash
node -e "const fs=require('fs');const zlib=require('zlib');function crc(buf){let c=-1;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^(0xedb88320&-(c&1));}return(c^(-1))>>>0;}function chunk(type,data){const t=Buffer.from(type);const out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([t,data])),8+data.length);return out;}function png(size,path){const raw=[];for(let y=0;y<size;y++){raw.push(0);for(let x=0;x<size;x++){const inTicket=x>size*.22&&x<size*.78&&y>size*.28&&y<size*.72;const stripe=Math.abs(x-y)<size*.05;const white=inTicket||stripe;raw.push(white?255:29,white?255:107,white?255:59,255);}}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;fs.mkdirSync('public',{recursive:true});fs.writeFileSync(path,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(Buffer.from(raw))),chunk('IEND',Buffer.alloc(0))]));}png(192,'public/pwa-192.png');png(512,'public/pwa-512.png');"
```

Verify the files:

```bash
node -e "const fs=require('fs');for(const f of ['public/pwa-192.png','public/pwa-512.png']){const b=fs.readFileSync(f);if(b.toString('hex',0,8)!=='89504e470d0a1a0a')throw new Error(f+' is not a PNG');console.log(f+' OK');}"
```

- [ ] **Step 4: Build and inspect PWA assets**

Run:

```bash
npm run build
```

Expected:

- Build exits successfully.
- `dist/manifest.webmanifest` exists.
- `dist/sw.js` exists.
- `dist/pwa-192.png` exists.
- `dist/pwa-512.png` exists.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts index.html public
git commit -m "feat: make app installable as pwa"
```

---

### Task 12: End-to-End Verification and Local Preview

**Files:**
- Modify only if verification exposes defects in files from prior tasks.

**Interfaces:**
- Consumes: completed PWA.
- Produces: verified build and local preview URL.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Start local preview**

Run:

```bash
npm run preview -- --port 4173
```

Expected: Vite preview serves the app at `http://localhost:4173`.

- [ ] **Step 4: Browser smoke test on desktop viewport**

Open `http://localhost:4173` and verify:

- Home page renders.
- Bottom navigation buttons switch pages.
- Manual ticket entry works if camera is unavailable.
- Ticket appears in list.
- Ticket can be marked won.
- Statistics update.
- Backup page can export JSON.

- [ ] **Step 5: Mobile-device test**

From the same network or deployed HTTPS URL, test on:

- Android Chrome.
- iPhone Safari.

Verify:

- Camera permission prompt appears on HTTPS.
- Manual entry fallback is visible.
- App can be added to the home screen.
- Previously saved records still appear after closing and reopening the app.

- [ ] **Step 6: Commit verification fixes**

If verification required code changes:

```bash
git add src public index.html vite.config.ts
git commit -m "fix: stabilize pwa verification"
```

If no code changes were required, do not create an empty commit.
