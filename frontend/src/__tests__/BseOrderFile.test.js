/**
 * BseOrderFile.test.js
 * Jest + React Testing Library — BSE Order File module
 *
 * 55 test cases across 11 describe groups.
 * Covers all QA report bugs (R-001 through R-006) and design findings.
 */

import React from "react";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChakraProvider } from "@chakra-ui/react";

// ── Named exports under test ──────────────────────────────────────────────────
import {
  generateBseCSV,
  buildTrades,
  SELL_ACTIONS,
  TODAY,
} from "views/admin/bse-order-file/index";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("react-apexcharts", () => () => <div data-testid="apex-chart" />);

jest.mock("react-icons/md", () => ({
  MdDownload:      () => <span />, MdPlayArrow: () => <span />,
  MdCheckCircle:   () => <span />, MdUpload:    () => <span />,
  MdExpandMore:    () => <span />, MdChevronRight: () => <span />,
  MdInsertDriveFile: () => <span />, MdCalendarToday: () => <span />,
  MdWarning:       () => <span />, // Design fix: overdue warning icon
}));

jest.mock("components/card/Card", () =>
  ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>
);

jest.mock("utils/tradeConstants", () => ({
  SELL_ACTIONS: new Set(["SELL", "TRIM", "TRIM/HOLD"]),
}));

jest.mock("views/admin/research-dashboard/components/ActionBadge", () =>
  ({ action }) => <span data-testid="action-badge">{action}</span>
);

// Silence Chakra prop warnings from Card mock
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("React does not recognize")) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });

// Mock URL.createObjectURL / revokeObjectURL (not in jsdom)
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = jest.fn();
});

// Context mock — mutable so individual tests can inject allUserRecs state
const mockStartBatch    = jest.fn();
const mockCompleteBatch = jest.fn();

let mockContextValue = {
  allUserRecs:   { "user-001": [], "user-002": [] },
  startBatch:    mockStartBatch,
  completeBatch: mockCompleteBatch,
};

jest.mock("contexts/RecommendationsContext", () => ({
  useRecommendations:     () => mockContextValue,
  RecommendationsProvider: ({ children }) => children,
}));

// mockData / schedule mocks
jest.mock("views/admin/research-dashboard/variables/mockData", () => ({
  mockUsers: [
    { id: "user-001", name: "Rahul Mehta",   accountId: "5201", clientCode: "C001",
      bankAccount: "BANK001", mobile: "9000000001", email: "rahul@test.com",
      aum: 8418710, riskMandate: "Aggressive" },
    { id: "user-002", name: "Surbhi Narain", accountId: "5202", clientCode: "C002",
      bankAccount: "BANK002", mobile: "9000000002", email: "surbhi@test.com",
      aum: 15200000, riskMandate: "Moderate" },
  ],
  schemeCodeByIsin: {
    "INF090I01JS8": "106235",
    "INF194K01W62": "143455",
    "INF204K01D30": "118989",
    "INF917K01FZ1": "135781",
    "INF194KB1AL4": "147622",
    "INF740K01UN2": "125354",
  },
}));

jest.mock("views/admin/research-dashboard/variables/mockScheduleData", () => ({
  mockSellSchedule: [
    { isin: "INF090I01JS8", bestSellDate: "2026-04-10", sellAmt: 954878, netCash: 928196 },
    { isin: "INF194K01W62", bestSellDate: "2026-04-10", sellAmt: 376981, netCash: 350299 },
  ],
  mockBuySchedule: [
    { isin: "INF204K01D30", buyDate: "2026-04-16", buyAmt: 1039700, pctOfCash: 43 },
    { isin: "INF194KB1AL4", buyDate: "2026-05-02", buyAmt: 908421, pctOfCash: 38 },
  ],
}));

// ── Test helpers ──────────────────────────────────────────────────────────────

import BseOrderFile from "views/admin/bse-order-file/index";

// Shared scheme-code map for generateBseCSV unit tests
const SCHEME_CODES = {
  "INF090I01JS8": "106235",
  "INF194K01W62": "143455",
  "INF204K01D30": "118989",
};

/** Build a mock SELL/TRIM recommendation */
function makeRec(overrides = {}) {
  return {
    isin: "INF090I01JS8", action: "SELL", amount: 954878, qty: 6160,
    isFullSell: false, clientCode: "C001", bankAccount: "BANK001",
    mobile: "9000000001", email: "rahul@test.com", executionDate: "2026-04-10",
    ...overrides,
  };
}

/** Build a mock BUY recommendation */
function makeBuyRec(overrides = {}) {
  return {
    isin: "INF204K01D30", action: "BUY", amount: 1039700, qty: 1155,
    isFullSell: false, clientCode: "C001", bankAccount: "BANK001",
    mobile: "9000000001", email: "rahul@test.com", executionDate: "2026-04-16",
    ...overrides,
  };
}

/** Wrap component with ChakraProvider to satisfy hook requirements */
function renderWithChakra(ui) {
  return render(<ChakraProvider>{ui}</ChakraProvider>);
}

/** Build a minimal APPROVED recommendation for buildTrades / context tests */
function makeApprovedRec(overrides = {}) {
  return {
    id: "rec-test-1", isin: "INF090I01JS8",
    assetName: "Franklin India ELSS", status: "APPROVED",
    recommendedAction: "SELL", amount: 954878, qty: 6160,
    currentValue: 1155424, ...overrides,
  };
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  mockContextValue = {
    allUserRecs:   { "user-001": [], "user-002": [] },
    startBatch:    mockStartBatch,
    completeBatch: mockCompleteBatch,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. generateBseCSV — pure function unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateBseCSV — column format", () => {
  it("[generateBseCSV] produces 22 header columns in correct order", () => {
    const csv    = generateBseCSV([makeRec()], SCHEME_CODES);
    const cols   = csv.split("\n")[0].split(",");
    expect(cols).toHaveLength(22);
    expect(cols[0]).toBe("SCHEME_CODE");
    expect(cols[1]).toBe("Purchase / Redeem");
    expect(cols[2]).toBe("buy_sell type");
    expect(cols[3]).toBe("Client Code");
    expect(cols[5]).toBe("Order Amount");
    expect(cols[14]).toBe("All units");
    expect(cols[15]).toBe("Redemption Units");
  });

  it("[generateBseCSV] maps SELL trade to Purchase/Redeem = R", () => {
    const csv  = generateBseCSV([makeRec({ action: "SELL" })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[1]).toBe("R");
  });

  it("[generateBseCSV] maps BUY trade to Purchase/Redeem = P", () => {
    const csv  = generateBseCSV([makeBuyRec({ action: "BUY" })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[1]).toBe("P");
  });

  it("[generateBseCSV] sets All units = Y for full SELL", () => {
    const csv  = generateBseCSV([makeRec({ isFullSell: true })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[14]).toBe("Y");
  });

  it("[generateBseCSV] sets All units = N for partial SELL", () => {
    const csv  = generateBseCSV([makeRec({ isFullSell: false })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[14]).toBe("N");
  });

  it("[generateBseCSV] sets All units = N for BUY (isFullSell irrelevant)", () => {
    const csv  = generateBseCSV([makeBuyRec({ isFullSell: true })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[14]).toBe("N");
  });

  it("[generateBseCSV] populates Redemption Units for partial SELL (BUG-002 fix)", () => {
    const csv  = generateBseCSV([makeRec({ action: "SELL", isFullSell: false, qty: 6160 })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[15]).toBe("6160"); // BUG-002: was always empty string
  });

  it("[generateBseCSV] leaves Redemption Units empty for full SELL", () => {
    const csv  = generateBseCSV([makeRec({ isFullSell: true })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[15]).toBe("");
  });

  it("[generateBseCSV] places correct scheme code from lookup", () => {
    const csv  = generateBseCSV([makeRec({ isin: "INF194K01W62" })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[0]).toBe("143455");
  });

  it("[generateBseCSV] uses empty string for unknown ISIN", () => {
    const csv  = generateBseCSV([makeRec({ isin: "UNKNOWN" })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[0]).toBe("");
  });

  it("[generateBseCSV] buy_sell type is always FRESH", () => {
    const csv   = generateBseCSV([makeRec(), makeBuyRec()], SCHEME_CODES);
    const lines = csv.split("\n").slice(1);
    lines.forEach((line) => expect(line.split(",")[2]).toBe("FRESH"));
  });

  it("[generateBseCSV] KYC flag is always Y", () => {
    const csv   = generateBseCSV([makeRec(), makeBuyRec()], SCHEME_CODES);
    const lines = csv.split("\n").slice(1);
    lines.forEach((line) => expect(line.split(",")[8]).toBe("Y"));
  });

  it("[generateBseCSV] row count equals trade count", () => {
    const trades = [makeRec(), makeBuyRec(), makeRec({ isin: "INF194K01W62" })];
    const lines  = generateBseCSV(trades, SCHEME_CODES).split("\n");
    expect(lines).toHaveLength(4); // 1 header + 3 data
  });

  it("[generateBseCSV] embeds client code in Client Code column", () => {
    const csv  = generateBseCSV([makeRec({ clientCode: "MY_CODE_99" })], SCHEME_CODES);
    const cols = csv.split("\n")[1].split(",");
    expect(cols[3]).toBe("MY_CODE_99");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. buildTrades — pure function unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("buildTrades — filtering and enrichment", () => {
  const user = { id: "user-001", clientCode: "C001", bankAccount: "BANK001", mobile: "9000000001", email: "e@test.com" };
  const dateMap = { "INF090I01JS8": "2026-04-10", "INF204K01D30": "2026-04-16" };

  it("[buildTrades] includes only APPROVED SELL trades in sell tab", () => {
    const recs = [
      makeApprovedRec({ recommendedAction: "SELL" }),
      makeApprovedRec({ id: "r2", recommendedAction: "HOLD",  status: "APPROVED" }),
      makeApprovedRec({ id: "r3", recommendedAction: "SELL",  status: "PENDING" }),
    ];
    const trades = buildTrades(recs, user, "sell", dateMap);
    expect(trades).toHaveLength(1);
    expect(trades[0].action).toBe("SELL");
  });

  it("[buildTrades] includes TRIM/HOLD in sell tab (BUG-003 fix)", () => {
    const recs = [makeApprovedRec({ recommendedAction: "TRIM/HOLD" })];
    const trades = buildTrades(recs, user, "sell", dateMap);
    expect(trades).toHaveLength(1); // BUG-003: was 0 before fix
  });

  it("[buildTrades] includes TRIM (no suffix) in sell tab", () => {
    const recs = [makeApprovedRec({ recommendedAction: "TRIM" })];
    const trades = buildTrades(recs, user, "sell", dateMap);
    expect(trades).toHaveLength(1);
  });

  it("[buildTrades] includes only APPROVED BUY trades in buy tab", () => {
    const recs = [
      makeApprovedRec({ id: "b1", isin: "INF204K01D30", recommendedAction: "BUY" }),
      makeApprovedRec({ id: "b2", recommendedAction: "SELL" }),
    ];
    const trades = buildTrades(recs, user, "buy", dateMap);
    expect(trades).toHaveLength(1);
    expect(trades[0].action).toBe("BUY");
  });

  it("[buildTrades] assigns executionDate from dateMap when ISIN is known", () => {
    const recs = [makeApprovedRec({ isin: "INF090I01JS8", recommendedAction: "SELL" })];
    const trades = buildTrades(recs, user, "sell", dateMap);
    expect(trades[0].executionDate).toBe("2026-04-10");
  });

  it("[buildTrades] falls back to TODAY for unknown ISIN", () => {
    const recs = [makeApprovedRec({ isin: "UNKNOWN_ISIN", recommendedAction: "SELL" })];
    const trades = buildTrades(recs, user, "sell", dateMap);
    expect(trades[0].executionDate).toBe(TODAY);
  });

  it("[buildTrades] SELL_ACTIONS set contains SELL, TRIM, TRIM/HOLD", () => {
    expect(SELL_ACTIONS.has("SELL")).toBe(true);
    expect(SELL_ACTIONS.has("TRIM")).toBe(true);
    expect(SELL_ACTIONS.has("TRIM/HOLD")).toBe(true);
    expect(SELL_ACTIONS.has("BUY")).toBe(false);
    expect(SELL_ACTIONS.has("HOLD")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Component — empty state
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile component — empty state", () => {
  it("[BseOrderFile] renders four summary stat cards with zero counts", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("stat-clients-ready")).toBeInTheDocument();
    expect(screen.getByTestId("stat-approved-trades")).toBeInTheDocument();
    expect(screen.getByTestId("stat-in-progress")).toBeInTheDocument();
    expect(screen.getByTestId("stat-completed")).toBeInTheDocument();
  });

  it("[BseOrderFile] renders all three tabs", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("tab-sell-orders")).toBeInTheDocument();
    expect(screen.getByTestId("tab-buy-orders")).toBeInTheDocument();
    expect(screen.getByTestId("tab-history")).toBeInTheDocument();
  });

  it("[BseOrderFile] Download CSV button is disabled when no APPROVED sell trades", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("download-csv-sell")).toBeDisabled();
  });

  it("[BseOrderFile] Start Batch button is disabled when no APPROVED sell trades", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("start-batch-sell")).toBeDisabled();
  });

  it("[BseOrderFile] History tab shows empty-state element", () => {
    renderWithChakra(<BseOrderFile />);
    fireEvent.click(screen.getByTestId("tab-history"));
    expect(screen.getByTestId("history-empty")).toBeInTheDocument();
  });

  it("[BseOrderFile] shows empty-state message when no approved trades", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("empty-state-message")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Component — approved trades flow
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile component — approved trades flow", () => {
  beforeEach(() => {
    mockContextValue.allUserRecs = {
      "user-001": [
        makeApprovedRec({ recommendedAction: "SELL", isin: "INF090I01JS8" }),
      ],
      "user-002": [],
    };
  });

  it("[BseOrderFile] renders client name when user-001 has APPROVED SELL trade", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("client-card-user-001")).toBeInTheDocument();
    expect(screen.getByText("Rahul Mehta")).toBeInTheDocument();
  });

  it("[BseOrderFile] Download CSV button is enabled when APPROVED sells exist", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("download-csv-sell")).not.toBeDisabled();
  });

  it("[BseOrderFile] Start Batch button is enabled when APPROVED sells exist", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("start-batch-sell")).not.toBeDisabled();
  });

  it("[BseOrderFile] HOLD trades do not appear in sell groups", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ recommendedAction: "HOLD" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    expect(screen.queryByTestId("client-card-user-001")).not.toBeInTheDocument();
  });

  it("[BseOrderFile] PENDING trades do not appear in sell groups", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ status: "PENDING", recommendedAction: "SELL" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    expect(screen.queryByTestId("client-card-user-001")).not.toBeInTheDocument();
  });

  it("[BseOrderFile] L2_PENDING trades do not appear", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ status: "L2_PENDING", recommendedAction: "SELL" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    expect(screen.queryByTestId("client-card-user-001")).not.toBeInTheDocument();
  });

  it("[BseOrderFile] Start Batch calls startBatch from context with tabType", () => {
    renderWithChakra(<BseOrderFile />);
    fireEvent.click(screen.getByTestId("start-batch-sell"));
    expect(mockStartBatch).toHaveBeenCalledWith("sell");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Multi-user scenario — Surbhi (user-002)
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile — multi-user scenario (Surbhi fix)", () => {
  it("[BseOrderFile] user-002 APPROVED SELL trades appear in Sell tab", () => {
    mockContextValue.allUserRecs = {
      "user-001": [],
      "user-002": [makeApprovedRec({
        id: "srec-1", isin: "INF740K01UN2",
        assetName: "Axis Bluechip", recommendedAction: "SELL",
      })],
    };
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("client-card-user-002")).toBeInTheDocument();
    expect(screen.getByText("Surbhi Narain")).toBeInTheDocument();
  });

  it("[BseOrderFile] user-002 APPROVED BUY trades appear in Buy tab", () => {
    mockContextValue.allUserRecs = {
      "user-001": [],
      "user-002": [makeApprovedRec({
        id: "srec-buy", isin: "INF204K01D30",
        assetName: "Nippon Large Cap", recommendedAction: "BUY", amount: 500000,
      })],
    };
    renderWithChakra(<BseOrderFile />);
    fireEvent.click(screen.getByTestId("tab-buy-orders"));
    expect(screen.getByTestId("client-card-user-002")).toBeInTheDocument();
  });

  it("[BseOrderFile] both users appear when both have APPROVED trades", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ recommendedAction: "SELL" })],
      "user-002": [makeApprovedRec({ id: "srec", isin: "INF740K01UN2", recommendedAction: "SELL" })],
    };
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("client-card-user-001")).toBeInTheDocument();
    expect(screen.getByTestId("client-card-user-002")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Today / Upcoming section split
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile — GroupedTradesList section split", () => {
  it("[GroupedTradesList] past/today trades land in Ready to Execute section", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ recommendedAction: "SELL", isin: "INF090I01JS8" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    // INF090I01JS8 maps to "2026-04-10" in mock schedule — past date → Ready section
    expect(screen.getByTestId("ready-section")).toBeInTheDocument();
  });

  it("[GroupedTradesList] future-dated trades land in Upcoming section", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({
        recommendedAction: "BUY", isin: "INF204K01D30", amount: 500000,
      })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    fireEvent.click(screen.getByTestId("tab-buy-orders"));
    // INF204K01D30 maps to "2026-04-16" in mock schedule — future → Upcoming
    expect(screen.getByTestId("upcoming-section")).toBeInTheDocument();
  });

  it("[GroupedTradesList] empty state message renders when allUserRecs is empty", () => {
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("empty-state-message")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. ClientCard — execution date badge
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile — ClientCard execution date badge", () => {
  it("[ClientCard] exec-date-header-badge renders for user-001", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ recommendedAction: "SELL", isin: "INF090I01JS8" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("exec-date-header-badge-user-001")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Batch state transitions
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile — batch state transitions", () => {
  it("[completeBatch] uploading BSE response calls completeBatch from context", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ status: "IN_PROGRESS", recommendedAction: "SELL" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    const input = screen.getByTestId("bse-response-input-sell");
    const file  = new File(["bse data"], "response.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(mockCompleteBatch).toHaveBeenCalledTimes(1);
  });

  it("[startBatch] Start Batch not called when button is disabled", () => {
    renderWithChakra(<BseOrderFile />); // no APPROVED trades
    expect(screen.getByTestId("start-batch-sell")).toBeDisabled();
    fireEvent.click(screen.getByTestId("start-batch-sell"));
    expect(mockStartBatch).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Summary statistics
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile — summary statistics", () => {
  it("[BseOrderFile] Clients Ready de-dupes users across sell and buy groups", () => {
    mockContextValue.allUserRecs = {
      "user-001": [
        makeApprovedRec({ id: "r1", recommendedAction: "SELL" }),
        makeApprovedRec({ id: "r2", isin: "INF204K01D30", recommendedAction: "BUY" }),
      ],
      "user-002": [
        makeApprovedRec({ id: "r3", isin: "INF740K01UN2", recommendedAction: "SELL" }),
      ],
    };
    renderWithChakra(<BseOrderFile />);
    const stat = screen.getByTestId("stat-clients-ready");
    // 2 unique users (not 3 if user-001 counted twice for sell + buy)
    expect(within(stat).getByText("2")).toBeInTheDocument();
  });

  it("[BseOrderFile] In Progress stat counts IN_PROGRESS records across all users", () => {
    mockContextValue.allUserRecs = {
      "user-001": [
        makeApprovedRec({ id: "ip1", status: "IN_PROGRESS", recommendedAction: "SELL" }),
        makeApprovedRec({ id: "ip2", status: "IN_PROGRESS", recommendedAction: "BUY" }),
      ],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    const stat = screen.getByTestId("stat-in-progress");
    expect(within(stat).getByText("2")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. R-004 — Tab-scoped completeBatch (sell upload does not complete buy orders)
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile — R-004: tab-scoped completeBatch", () => {
  it("[R-004] uploading sell response calls completeBatch with tabType 'sell'", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ status: "IN_PROGRESS", recommendedAction: "SELL" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    const input = screen.getByTestId("bse-response-input-sell");
    fireEvent.change(input, { target: { files: [new File([""], "sell.csv")] } });
    expect(mockCompleteBatch).toHaveBeenCalledWith("sell");
  });

  it("[R-004] uploading buy response calls completeBatch with tabType 'buy'", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ id: "b1", status: "IN_PROGRESS", recommendedAction: "BUY" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    fireEvent.click(screen.getByTestId("tab-buy-orders"));
    const input = screen.getByTestId("bse-response-input-buy");
    fireEvent.change(input, { target: { files: [new File([""], "buy.csv")] } });
    expect(mockCompleteBatch).toHaveBeenCalledWith("buy");
  });

  it("[R-004] sell upload does NOT call completeBatch with 'buy'", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ status: "IN_PROGRESS", recommendedAction: "SELL" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    const input = screen.getByTestId("bse-response-input-sell");
    fireEvent.change(input, { target: { files: [new File([""], "sell.csv")] } });
    expect(mockCompleteBatch).not.toHaveBeenCalledWith("buy");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. R-005 — isFullSell float tolerance + R-006 — unique trade keys
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile — R-005 / R-006: isFullSell and trade keys", () => {
  const user = { id: "user-001", clientCode: "C001", bankAccount: "BANK001", mobile: "9000000001", email: "e@test.com" };
  const dateMap = {};

  it("[R-005] isFullSell=true when amount and currentValue differ by less than ₹1", () => {
    // e.g., ₹954878.00 vs ₹954878.49 — float rounding within ₹1 → treat as full sell
    const recs = [makeApprovedRec({ amount: 954878.00, currentValue: 954878.49 })];
    const trades = buildTrades(recs, user, "sell", dateMap);
    expect(trades[0].isFullSell).toBe(true);
  });

  it("[R-005] isFullSell=false when amount differs from currentValue by more than ₹1", () => {
    const recs = [makeApprovedRec({ amount: 500000, currentValue: 1155424 })];
    const trades = buildTrades(recs, user, "sell", dateMap);
    expect(trades[0].isFullSell).toBe(false);
  });

  it("[R-006] trade.id is propagated to trade object for stable keying", () => {
    const recs = [makeApprovedRec({ id: "stable-id-123" })];
    const trades = buildTrades(recs, user, "sell", dateMap);
    expect(trades[0].id).toBe("stable-id-123");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Design — badge colors and overdue banner
// ─────────────────────────────────────────────────────────────────────────────

describe("BseOrderFile — design: badge colors and overdue banner", () => {
  it("[Design] overdue-alert banner renders when a trade's executionDate is in the past", () => {
    // INF090I01JS8 → bestSellDate "2026-04-10" (past) — should trigger overdue banner
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ recommendedAction: "SELL", isin: "INF090I01JS8" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    expect(screen.getByTestId("overdue-alert")).toBeInTheDocument();
  });

  it("[Design] overdue-alert does NOT render when all trades are future-dated", () => {
    // INF204K01D30 → buyDate "2026-04-16" (future) — no overdue banner
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({
        id: "b1", recommendedAction: "BUY", isin: "INF204K01D30", amount: 500000,
      })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    fireEvent.click(screen.getByTestId("tab-buy-orders"));
    expect(screen.queryByTestId("overdue-alert")).not.toBeInTheDocument();
  });

  it("[Design] exec-date-header-badge shows 'Overdue' text for past execution date", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ recommendedAction: "SELL", isin: "INF090I01JS8" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    const badge = screen.getByTestId("exec-date-header-badge-user-001");
    expect(badge).toHaveTextContent("Overdue");
  });

  it("[Design] ClientCard accordion has role=button and aria-expanded attribute", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ recommendedAction: "SELL" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    const card = screen.getByTestId("client-card-user-001");
    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("aria-expanded", "false");
  });

  it("[Design] aria-expanded toggles to true when ClientCard is clicked", () => {
    mockContextValue.allUserRecs = {
      "user-001": [makeApprovedRec({ recommendedAction: "SELL" })],
      "user-002": [],
    };
    renderWithChakra(<BseOrderFile />);
    const card = screen.getByTestId("client-card-user-001");
    fireEvent.click(card);
    expect(card).toHaveAttribute("aria-expanded", "true");
  });
});
