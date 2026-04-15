/**
 * bse-order-file/index.jsx
 *
 * BSE Star Order Execution hub.
 *
 * Bug fixes in this version:
 *   R-001 — SELL_ACTIONS imported from shared utils (no dual definition)
 *   R-004 — Separate sell/buy upload handlers call completeBatch("sell"/"buy")
 *   R-005 — isFullSell uses ₹1 tolerance instead of float equality
 *   R-006 — TradeRow keyed by trade.id (not isin+date, avoids multi-lot collision)
 *   Design — Overdue=red, Today=orange, Future=blue badge colors
 *   Design — aria-expanded + role + keyboard on ClientCard accordion
 *   Design — aria-live on in-progress alert; cross-tab overdue banner
 */

import {
  Box, Flex, Text, Button, SimpleGrid, Stat, StatLabel, StatNumber,
  useColorModeValue, Badge, Divider, Table, Thead, Tbody, Tr, Th, Td,
  Collapse, Icon, useToast, Alert, AlertIcon, Input,
  Tabs, TabList, Tab, TabPanels, TabPanel,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useMemo, useCallback, useState, useRef } from "react";
import {
  MdDownload, MdPlayArrow, MdUpload,
  MdExpandMore, MdChevronRight, MdInsertDriveFile, MdCalendarToday, MdWarning,
} from "react-icons/md";

import { useRecommendations } from "contexts/RecommendationsContext";
// R-001 fix: import from single source of truth
import { SELL_ACTIONS } from "utils/tradeConstants";
import { mockUsers, schemeCodeByIsin } from "views/admin/research-dashboard/variables/mockData";
import { mockSellSchedule, mockBuySchedule } from "views/admin/research-dashboard/variables/mockScheduleData";
import ActionBadge from "views/admin/research-dashboard/components/ActionBadge";

// ── Re-export for test suite back-compat ──────────────────────────────────────
export { SELL_ACTIONS };

// ── Schedule lookup maps ──────────────────────────────────────────────────────

export const sellDateByIsin = mockSellSchedule.reduce((acc, row) => {
  if (!acc[row.isin] || row.bestSellDate < acc[row.isin]) acc[row.isin] = row.bestSellDate;
  return acc;
}, {});

export const buyDateByIsin = mockBuySchedule.reduce((acc, row) => {
  if (!acc[row.isin] || row.buyDate < acc[row.isin]) acc[row.isin] = row.buyDate;
  return acc;
}, {});

export const TODAY = new Date().toISOString().slice(0, 10);

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmt(v) {
  if (!v && v !== 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(v);
}

function fmtAUM(v) {
  if (!v) return "—";
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  });
}

export function fmtDateLong(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const MANDATE_COLOR = { Aggressive: "purple", Moderate: "teal", Conservative: "green" };

// ── Execution date badge helpers ──────────────────────────────────────────────
// Design fix: Overdue=red, Today=orange, Future=blue (not all green)

function execDateScheme(iso) {
  if (!iso) return "gray";
  if (iso < TODAY) return "red";
  if (iso === TODAY) return "orange";
  return "blue";
}

function execDateLabel(iso) {
  if (!iso) return "—";
  if (iso < TODAY)  return `Overdue · ${fmtDate(iso)}`;
  if (iso === TODAY) return `Today · ${fmtDate(iso)}`;
  return fmtDate(iso);
}

// ── CSV generation ────────────────────────────────────────────────────────────

function generateRemark(trade, index) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const code = String(trade.clientCode ?? "").slice(-6).padStart(6, "0");
  return `RBL${date}${code}${String(index).padStart(3, "0")}`;
}

export function generateBseCSV(trades, schemeCodeMap = schemeCodeByIsin) {
  const HEADER = [
    "SCHEME_CODE", "Purchase / Redeem", "buy_sell type", "Client Code",
    "DP TXN Mode", "Order Amount", "Folio number", "Remark", "KYC flag",
    "Sub brocker code", "EUIN Number", "EUIN Declaration", "MIN redemption flag",
    "DPC Flag", "All units", "Redemption Units", "Sub broker ARN",
    "PG/Bank Ref.No.", "Bank account No.", "Mobile No.", "Email id", "Mandate id",
  ].join(",");

  const rows = trades.map((trade, i) => {
    const schemeCode      = schemeCodeMap[trade.isin] ?? "";
    const purchaseRedeem  = trade.action === "BUY" ? "P" : "R";
    const isSell          = trade.action !== "BUY";
    const allUnits        = isSell && trade.isFullSell ? "Y" : "N";
    // R-002/BUG-002: Redemption Units for partial sells
    const redemptionUnits = isSell && !trade.isFullSell ? (trade.qty ?? "") : "";

    return [
      schemeCode, purchaseRedeem, "FRESH", trade.clientCode ?? "",
      "C", trade.amount ?? "", "", generateRemark(trade, i), "Y",
      "", "", "N", "N", "N", allUnits, redemptionUnits, "",
      "", trade.bankAccount ?? "", "", trade.email ?? "", "",
    ].join(",");
  });

  return [HEADER, ...rows].join("\n");
}

export function buildTrades(recs, user, tabType, dateMap) {
  return recs
    .filter((r) => {
      if (r.status !== "APPROVED") return false;
      // R-001/BUG-003: SELL_ACTIONS Set from shared utils
      return tabType === "sell" ? SELL_ACTIONS.has(r.recommendedAction)
                                : r.recommendedAction === "BUY";
    })
    .map((r) => ({
      id:            r.id,  // R-006: stable id for React key
      isin:          r.isin,
      assetName:     r.assetName,
      action:        r.recommendedAction,
      amount:        r.amount,
      qty:           r.qty ?? 0,
      // R-005 fix: ₹1 tolerance instead of strict float equality
      isFullSell:    Math.abs((r.amount ?? 0) - (r.currentValue ?? 0)) < 1,
      executionDate: dateMap[r.isin] ?? TODAY,
      clientCode:    user.clientCode ?? user.accountId,
      bankAccount:   user.bankAccount ?? "",
      mobile:        user.mobile ?? "",
      email:         user.email ?? "",
    }));
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── TradeRow ──────────────────────────────────────────────────────────────────

function TradeRow({ trade, borderColor }) {
  const scheme    = execDateScheme(trade.executionDate);
  const dateLabel = execDateLabel(trade.executionDate);

  return (
    <Tr>
      <Td fontSize="sm" borderColor={borderColor}>
        <Box>
          <Text fontWeight="600" noOfLines={1}>{trade.assetName}</Text>
          <Text fontSize="10px" color="gray.500" fontFamily="mono">{trade.isin}</Text>
        </Box>
      </Td>
      <Td fontSize="sm" borderColor={borderColor}>
        <ActionBadge action={trade.action} />
      </Td>
      <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>
        {fmt(trade.amount)}
      </Td>
      <Td fontSize="sm" isNumeric borderColor={borderColor}>
        {trade.qty > 0 ? trade.qty.toLocaleString("en-IN") : "—"}
      </Td>
      <Td fontSize="sm" borderColor={borderColor} fontFamily="mono" color="gray.500">
        {schemeCodeByIsin[trade.isin] ?? (
          <Text as="span" color="red.400" fontSize="xs">Missing</Text>
        )}
      </Td>
      <Td fontSize="sm" borderColor={borderColor}>
        <Badge
          data-testid={`exec-date-badge-${trade.isin}`}
          colorScheme={scheme}
          variant="subtle"
          borderRadius="full"
          fontSize="xs"
          px="2"
          aria-label={dateLabel}
        >
          {dateLabel}
        </Badge>
      </Td>
    </Tr>
  );
}

// ── ClientCard ────────────────────────────────────────────────────────────────

function ClientCard({ user, trades, borderColor }) {
  const [expanded, setExpanded] = useState(false);
  const textColor = useColorModeValue("gray.800", "white");
  const hoverBg   = useColorModeValue("blue.50", "whiteAlpha.50");
  const totalAmt  = trades.reduce((s, t) => s + (t.amount ?? 0), 0);

  const execDate = trades.reduce(
    (min, t) => (!min || t.executionDate < min ? t.executionDate : min), null,
  );
  const badgeScheme = execDateScheme(execDate);
  const badgeLabel  = execDateLabel(execDate);
  const isOverdue   = execDate && execDate < TODAY;

  const tableId = `trade-table-${user.id}`;

  return (
    <Box borderBottom="1px solid" borderColor={borderColor}>
      {/* Design fix: role="button" + aria-expanded + keyboard nav on accordion header */}
      <Flex
        data-testid={`client-card-${user.id}`}
        role="button"
        aria-expanded={expanded}
        aria-controls={tableId}
        tabIndex={0}
        px="25px" py="14px" align="center" gap="12px" cursor="pointer"
        _hover={{ bg: hoverBg }}
        _focusVisible={{ outline: "2px solid", outlineColor: "brand.500", outlineOffset: "-2px" }}
        onClick={() => setExpanded((p) => !p)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((p) => !p);
          }
        }}
        flexWrap="wrap"
      >
        <Icon
          as={expanded ? MdExpandMore : MdChevronRight}
          color="gray.500" w="16px" h="16px" flexShrink={0}
          aria-hidden="true"
        />

        <Box flex="1" minW="160px">
          <Text fontSize="sm" fontWeight="700" color={textColor}>{user.name}</Text>
          <Text fontSize="10px" color="gray.500" fontFamily="mono">
            {user.clientCode ?? user.accountId}
          </Text>
        </Box>

        <Badge colorScheme={MANDATE_COLOR[user.riskMandate] ?? "gray"} borderRadius="full" px="2">
          {user.riskMandate}
        </Badge>

        <Text fontSize="sm" color={textColor} fontWeight="600">{fmtAUM(user.aum)}</Text>

        {execDate && (
          <Flex align="center" gap="4px">
            {/* Design fix: show warning icon for overdue trades */}
            <Icon
              as={isOverdue ? MdWarning : MdCalendarToday}
              color={isOverdue ? "red.500" : badgeScheme + ".400"}
              w="13px" h="13px"
              aria-hidden="true"
            />
            <Badge
              data-testid={`exec-date-header-badge-${user.id}`}
              colorScheme={badgeScheme}
              variant="subtle"
              borderRadius="full"
              px="2"
              fontSize="xs"
              aria-label={badgeLabel}
            >
              {badgeLabel}
            </Badge>
          </Flex>
        )}

        <Badge
          data-testid={`trade-count-badge-${user.id}`}
          colorScheme="gray"   // Design fix: count is neutral, not positive → gray
          variant="outline"
          borderRadius="full"
          px="2"
        >
          {trades.length} trade{trades.length !== 1 ? "s" : ""}
        </Badge>

        <Text fontSize="sm" color="green.500" fontWeight="700">{fmt(totalAmt)}</Text>
      </Flex>

      <Collapse in={expanded} animateOpacity>
        {/* R-006 fix: id wired to aria-controls above */}
        <Box id={tableId} px="25px" pb="12px">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th fontSize="10px" borderColor={borderColor}>Fund</Th>
                <Th fontSize="10px" borderColor={borderColor}>Action</Th>
                <Th fontSize="10px" isNumeric borderColor={borderColor}>Amount</Th>
                <Th fontSize="10px" isNumeric borderColor={borderColor}>Qty</Th>
                <Th fontSize="10px" borderColor={borderColor}>Scheme Code</Th>
                <Th fontSize="10px" borderColor={borderColor}>Exec Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {trades.map((t) => (
                // R-006 fix: use trade.id as key — unique even for multi-lot same-ISIN/date
                <TradeRow key={t.id} trade={t} borderColor={borderColor} />
              ))}
            </Tbody>
          </Table>
        </Box>
      </Collapse>
    </Box>
  );
}

// ── Date sub-header inside Upcoming ──────────────────────────────────────────

function DateSubHeader({ date, tradeCount, borderColor, sectionBg }) {
  return (
    <Flex
      data-testid={`date-subheader-${date}`}
      px="25px" py="10px"
      bg={sectionBg}
      borderBottom="1px solid" borderColor={borderColor}
      align="center" gap="8px"
    >
      <Icon as={MdCalendarToday} color="blue.400" w="14px" h="14px" aria-hidden="true" />
      <Text fontSize="sm" fontWeight="700" color="blue.500">{fmtDateLong(date)}</Text>
      <Badge colorScheme="blue" variant="outline" borderRadius="full" fontSize="xs" px="2">
        {tradeCount} trade{tradeCount !== 1 ? "s" : ""}
      </Badge>
    </Flex>
  );
}

// ── GroupedTradesList ─────────────────────────────────────────────────────────

function GroupedTradesList({ clientGroups, emptyMessage, inProgressCount, completedCount }) {
  const textColor   = useColorModeValue("gray.800", "white");
  const subColor    = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const sectionBg   = useColorModeValue("gray.50", "navy.900");

  const { readyGroups, upcomingDates } = useMemo(() => {
    const _ready  = [];
    const dateMap = {};

    for (const { user, trades } of clientGroups) {
      const readyTrades  = trades.filter((t) => t.executionDate <= TODAY);
      const futureTrades = trades.filter((t) => t.executionDate > TODAY);

      if (readyTrades.length > 0) _ready.push({ user, trades: readyTrades });

      for (const trade of futureTrades) {
        const d = trade.executionDate;
        if (!dateMap[d]) dateMap[d] = {};
        if (!dateMap[d][user.id]) dateMap[d][user.id] = { user, trades: [] };
        dateMap[d][user.id].trades.push(trade);
      }
    }

    const _upcoming = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, userMap]) => ({ date, groups: Object.values(userMap) }));

    return { readyGroups: _ready, upcomingDates: _upcoming };
  }, [clientGroups]);

  const readyCount    = readyGroups.reduce((s, g) => s + g.trades.length, 0);
  const upcomingCount = upcomingDates.reduce(
    (s, d) => s + d.groups.reduce((ss, g) => ss + g.trades.length, 0), 0,
  );
  const hasAny = readyGroups.length > 0 || upcomingDates.length > 0;

  if (!hasAny) {
    return (
      <Card data-testid="empty-state-card" flexDirection="column" w="100%" px="0px">
        <Flex py="60px" justify="center" align="center" direction="column" gap="8px">
          <Text fontSize="2xl" aria-hidden="true">
            {inProgressCount > 0 || completedCount > 0 ? "⏳" : "—"}
          </Text>
          <Text data-testid="empty-state-message" color={subColor} fontSize="sm">
            {emptyMessage}
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <>
      {/* ── Section 1: Ready to Execute ── */}
      <Card data-testid="ready-section" flexDirection="column" w="100%" px="0px" mb="20px">
        <Flex px="25px" pt="20px" pb="16px" align="center" justify="space-between">
          <Box>
            <Flex align="center" gap="8px">
              <Text color={textColor} fontSize="lg" fontWeight="700">Ready to Execute</Text>
              <Badge colorScheme="green" borderRadius="full" px="2">
                {fmtDateLong(TODAY)}
              </Badge>
            </Flex>
            <Text color={subColor} fontSize="sm" mt="2px">
              {readyGroups.length === 0
                ? "No trades are due for today's execution window."
                : `${readyGroups.length} client${readyGroups.length > 1 ? "s" : ""} · ${readyCount} trade${readyCount !== 1 ? "s" : ""} ready to batch`}
            </Text>
          </Box>
          {readyCount > 0 && (
            <Badge colorScheme="green" fontSize="sm" borderRadius="full" px="3" py="1">
              {fmt(readyGroups.reduce(
                (s, g) => s + g.trades.reduce((ts, t) => ts + (t.amount ?? 0), 0), 0,
              ))}
            </Badge>
          )}
        </Flex>
        <Divider />
        {readyGroups.length === 0 ? (
          <Flex py="40px" justify="center" align="center">
            <Text color={subColor} fontSize="sm">
              No trades are due for today's execution window.
            </Text>
          </Flex>
        ) : (
          readyGroups.map(({ user, trades }) => (
            <ClientCard key={user.id} user={user} trades={trades} borderColor={borderColor} />
          ))
        )}
      </Card>

      {/* ── Section 2: Upcoming ── */}
      {upcomingDates.length > 0 && (
        <Card data-testid="upcoming-section" flexDirection="column" w="100%" px="0px">
          <Flex px="25px" pt="20px" pb="16px" align="center" justify="space-between">
            <Box>
              <Flex align="center" gap="8px">
                <Text color={textColor} fontSize="lg" fontWeight="700">Upcoming</Text>
                <Badge colorScheme="blue" variant="subtle" borderRadius="full" px="2">
                  {upcomingDates.length} date{upcomingDates.length > 1 ? "s" : ""}
                </Badge>
              </Flex>
              <Text color={subColor} fontSize="sm" mt="2px">
                {upcomingCount} trade{upcomingCount !== 1 ? "s" : ""} across future execution windows
              </Text>
            </Box>
          </Flex>
          <Divider />
          {upcomingDates.map(({ date, groups }) => {
            const cnt = groups.reduce((s, g) => s + g.trades.length, 0);
            return (
              <Box key={date}>
                <DateSubHeader
                  date={date} tradeCount={cnt}
                  borderColor={borderColor} sectionBg={sectionBg}
                />
                {groups.map(({ user, trades }) => (
                  <ClientCard key={user.id} user={user} trades={trades} borderColor={borderColor} />
                ))}
              </Box>
            );
          })}
        </Card>
      )}
    </>
  );
}

// ── OrderTabContent ───────────────────────────────────────────────────────────

function OrderTabContent({ tabType, clientGroups, onDownload, onStartBatch, onUpload }) {
  const textColor    = useColorModeValue("gray.800", "white");
  const fileInputRef = useRef(null);

  const { allUserRecs } = useRecommendations();
  const allRecs = useMemo(() => Object.values(allUserRecs).flat(), [allUserRecs]);

  const inProgressCount = useMemo(
    () => allRecs.filter((r) => r.status === "IN_PROGRESS").length, [allRecs],
  );
  const completedCount = useMemo(
    () => allRecs.filter((r) => r.status === "COMPLETED").length, [allRecs],
  );

  const totalTrades = clientGroups.reduce((s, g) => s + g.trades.length, 0);
  const totalAmount = clientGroups.reduce(
    (s, g) => s + g.trades.reduce((ts, t) => ts + (t.amount ?? 0), 0), 0,
  );
  const typeLabel = tabType === "sell" ? "sell / trim" : "buy";

  const emptyMessage = inProgressCount > 0
    ? "All orders batched. Upload BSE response to complete."
    : completedCount > 0
      ? "All orders completed this cycle."
      : "Approve trades from the Rebalance workflow to see them here.";

  return (
    <>
      <Card mb="20px" p="16px" data-testid={`execution-hub-${tabType}`}>
        <Flex align="center" justify="space-between" flexWrap="wrap" gap="12px">
          <Box>
            <Text color={textColor} fontWeight="700">Execution Hub</Text>
            <Text fontSize="sm" color="gray.500">
              {totalTrades > 0
                ? `${totalTrades} approved ${typeLabel} trade${totalTrades !== 1 ? "s" : ""} totalling ${fmt(totalAmount)} ready for BSE Star.`
                : inProgressCount > 0
                  ? `${inProgressCount} trade${inProgressCount !== 1 ? "s" : ""} in progress. Upload BSE response to complete.`
                  : `No approved ${typeLabel} trades pending execution.`}
            </Text>
          </Box>
          <Flex gap="8px" align="center" flexWrap="wrap">
            <Button
              data-testid={`download-csv-${tabType}`}
              size="sm" leftIcon={<MdDownload />} variant="outline" colorScheme="gray"
              isDisabled={totalTrades === 0} onClick={onDownload}
            >
              Download CSV
            </Button>
            <Button
              data-testid={`start-batch-${tabType}`}
              size="sm" leftIcon={<MdPlayArrow />} colorScheme="brand"
              isDisabled={totalTrades === 0} onClick={onStartBatch}
            >
              Start Batch
            </Button>
            <Divider orientation="vertical" h="30px" mx="4px" />
            <Button
              data-testid={`upload-response-${tabType}`}
              size="sm" leftIcon={<MdUpload />} colorScheme="teal" variant="outline"
              isDisabled={inProgressCount === 0}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload BSE Response
            </Button>
            <Input
              data-testid={`bse-response-input-${tabType}`}
              ref={fileInputRef} type="file" accept=".csv,.txt"
              display="none" onChange={onUpload}
            />
          </Flex>
        </Flex>
      </Card>

      {/* Design fix: aria-live="polite" so screen readers announce status */}
      {inProgressCount > 0 && (
        <Alert
          data-testid="in-progress-alert"
          status="info" borderRadius="md" mb="20px"
          aria-live="polite"
        >
          <AlertIcon />
          <Text fontSize="sm">
            <strong>{inProgressCount} order{inProgressCount !== 1 ? "s" : ""}</strong> sent to BSE Star.
            Upload the BSE response file to confirm placement.
          </Text>
        </Alert>
      )}

      <GroupedTradesList
        clientGroups={clientGroups}
        emptyMessage={emptyMessage}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
      />
    </>
  );
}

// ── HistoryTab ────────────────────────────────────────────────────────────────

function HistoryTab({ sellHistory, buyHistory, onRedownload }) {
  const textColor   = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const combined    = [...sellHistory, ...buyHistory].sort((a, b) => b.id - a.id);

  if (combined.length === 0) {
    return (
      <Flex data-testid="history-empty" py="60px" justify="center" align="center" direction="column" gap="8px">
        <Text fontSize="2xl" aria-hidden="true">—</Text>
        <Text color="gray.500" fontSize="sm">
          No files generated yet. Use Sell Orders or Buy Orders tab to download a BSE file.
        </Text>
      </Flex>
    );
  }

  return (
    <Card flexDirection="column" w="100%" px="0px">
      <Flex px="25px" pt="16px" pb="12px" align="center" gap="8px">
        <Icon as={MdInsertDriveFile} color="gray.500" aria-hidden="true" />
        <Text color={textColor} fontWeight="700" fontSize="md">Generated Files</Text>
        <Badge colorScheme="gray" borderRadius="full" ml="4px">{combined.length}</Badge>
      </Flex>
      <Divider />
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th fontSize="10px" borderColor={borderColor}>Filename</Th>
            <Th fontSize="10px" borderColor={borderColor}>Type</Th>
            <Th fontSize="10px" borderColor={borderColor}>Generated</Th>
            <Th fontSize="10px" isNumeric borderColor={borderColor}>Trades</Th>
            <Th fontSize="10px" isNumeric borderColor={borderColor}>Amount</Th>
            <Th fontSize="10px" borderColor={borderColor} />
          </Tr>
        </Thead>
        <Tbody>
          {combined.map((entry) => (
            <Tr key={entry.id}>
              <Td fontSize="sm" fontFamily="mono" borderColor={borderColor}>{entry.filename}</Td>
              <Td borderColor={borderColor}>
                <Badge colorScheme={entry.tabType === "sell" ? "orange" : "green"} borderRadius="full">
                  {entry.tabType.toUpperCase()}
                </Badge>
              </Td>
              <Td fontSize="sm" color="gray.500" borderColor={borderColor}>{entry.date}</Td>
              <Td fontSize="sm" isNumeric borderColor={borderColor}>{entry.tradeCount}</Td>
              <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>
                {fmt(entry.totalAmount)}
              </Td>
              <Td borderColor={borderColor}>
                <Button
                  data-testid={`redownload-${entry.id}`}
                  size="xs" variant="ghost" leftIcon={<MdDownload />}
                  onClick={() => onRedownload(entry)}
                >
                  Re-download
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BseOrderFile() {
  const { allUserRecs, startBatch, completeBatch } = useRecommendations();
  const toast     = useToast();
  const textColor = useColorModeValue("gray.800", "white");

  const [sellFileHistory, setSellFileHistory] = useState([]);
  const [buyFileHistory,  setBuyFileHistory]  = useState([]);

  const userById = useMemo(
    () => Object.fromEntries(mockUsers.map((u) => [u.id, u])),
    [],
  );

  const sellClientGroups = useMemo(() => {
    const groups = [];
    for (const [userId, recs] of Object.entries(allUserRecs)) {
      const user = userById[userId];
      if (!user) continue;
      const trades = buildTrades(recs, user, "sell", sellDateByIsin);
      if (trades.length > 0) groups.push({ user, trades });
    }
    return groups;
  }, [allUserRecs, userById]);

  const buyClientGroups = useMemo(() => {
    const groups = [];
    for (const [userId, recs] of Object.entries(allUserRecs)) {
      const user = userById[userId];
      if (!user) continue;
      const trades = buildTrades(recs, user, "buy", buyDateByIsin);
      if (trades.length > 0) groups.push({ user, trades });
    }
    return groups;
  }, [allUserRecs, userById]);

  const allRecs         = useMemo(() => Object.values(allUserRecs).flat(), [allUserRecs]);
  const inProgressCount = useMemo(() => allRecs.filter((r) => r.status === "IN_PROGRESS").length, [allRecs]);
  const completedCount  = useMemo(() => allRecs.filter((r) => r.status === "COMPLETED").length, [allRecs]);

  // Design fix: cross-tab overdue banner counts overdue across both groups
  const overdueCount = useMemo(() => {
    return [...sellClientGroups, ...buyClientGroups]
      .flatMap((g) => g.trades)
      .filter((t) => t.executionDate < TODAY)
      .length;
  }, [sellClientGroups, buyClientGroups]);

  const handleDownload = useCallback((clientGroups, tabType, setHistory) => {
    const allTrades = clientGroups.flatMap((g) => g.trades);
    if (allTrades.length === 0) {
      toast({ title: "No trades to export.", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
      return null;
    }
    const csv      = generateBseCSV(allTrades);
    const date     = new Date().toISOString().slice(0, 10);
    const typeTag  = tabType === "sell" ? "SELL" : "BUY";
    const filename = `Lumpsum_Order_Punch_GIT_${typeTag}_${date.replace(/-/g, "_")}.csv`;
    downloadCSV(csv, filename);

    const totalAmount = allTrades.reduce((s, t) => s + (t.amount ?? 0), 0);
    const entry = {
      id: Date.now(), filename, tabType,
      date: new Date().toLocaleString("en-IN"),
      tradeCount: allTrades.length, totalAmount, csv,
    };
    setHistory((prev) => [entry, ...prev]);
    toast({
      title: "BSE order file downloaded.",
      description: `${allTrades.length} orders in BSE Star format.`,
      status: "success", duration: 4000, isClosable: true, position: "top-right",
    });
    return entry;
  }, [toast]);

  // Sell handlers
  const handleSellDownload = useCallback(
    () => handleDownload(sellClientGroups, "sell", setSellFileHistory),
    [handleDownload, sellClientGroups],
  );
  const handleSellStartBatch = useCallback(() => {
    const entry = handleSellDownload();
    if (entry) {
      startBatch("sell");
      toast({ title: "Sell batch started.", description: "Sell orders moved to In Progress.", status: "info", duration: 5000, isClosable: true, position: "top-right" });
    }
  }, [handleSellDownload, startBatch, toast]);
  // R-004 fix: sell response upload only completes sell-type IN_PROGRESS records
  const handleSellResponseUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    completeBatch("sell");
    toast({ title: "Sell BSE response uploaded.", description: `${file.name} processed. Sell orders marked Completed.`, status: "success", duration: 5000, isClosable: true, position: "top-right" });
    if (e.target) e.target.value = "";
  }, [completeBatch, toast]);

  // Buy handlers
  const handleBuyDownload = useCallback(
    () => handleDownload(buyClientGroups, "buy", setBuyFileHistory),
    [handleDownload, buyClientGroups],
  );
  const handleBuyStartBatch = useCallback(() => {
    const entry = handleBuyDownload();
    if (entry) {
      startBatch("buy");
      toast({ title: "Buy batch started.", description: "Buy orders moved to In Progress.", status: "info", duration: 5000, isClosable: true, position: "top-right" });
    }
  }, [handleBuyDownload, startBatch, toast]);
  // R-004 fix: buy response upload only completes buy-type IN_PROGRESS records
  const handleBuyResponseUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    completeBatch("buy");
    toast({ title: "Buy BSE response uploaded.", description: `${file.name} processed. Buy orders marked Completed.`, status: "success", duration: 5000, isClosable: true, position: "top-right" });
    if (e.target) e.target.value = "";
  }, [completeBatch, toast]);

  const handleRedownload = useCallback((entry) => {
    downloadCSV(entry.csv, entry.filename);
    toast({ title: `Re-downloaded ${entry.filename}`, status: "info", duration: 2000, isClosable: true, position: "top-right" });
  }, [toast]);

  const sellTotal = sellClientGroups.reduce((s, g) => s + g.trades.length, 0);
  const buyTotal  = buyClientGroups.reduce((s, g) => s + g.trades.length, 0);
  // Dark mode: stat card background must respond to color mode
  const statCardBg = useColorModeValue("white", "navy.800");

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Summary stats */}
      <SimpleGrid columns={{ base: 1, md: 4 }} gap="20px" mb="20px">
        <Stat data-testid="stat-clients-ready" bg={statCardBg} borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Clients Ready</StatLabel>
          <StatNumber fontSize="2xl" color="green.500">
            {new Set([...sellClientGroups, ...buyClientGroups].map((g) => g.user.id)).size}
          </StatNumber>
        </Stat>
        <Stat data-testid="stat-approved-trades" bg={statCardBg} borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Approved Trades</StatLabel>
          <StatNumber fontSize="2xl" color={textColor}>{sellTotal + buyTotal}</StatNumber>
        </Stat>
        <Stat data-testid="stat-in-progress" bg={statCardBg} borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">In Progress</StatLabel>
          <StatNumber fontSize="2xl" color="blue.500">{inProgressCount}</StatNumber>
        </Stat>
        <Stat data-testid="stat-completed" bg={statCardBg} borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Completed</StatLabel>
          <StatNumber fontSize="2xl" color="gray.400">{completedCount}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Design fix: cross-tab overdue banner — visible regardless of active tab */}
      {overdueCount > 0 && (
        <Alert
          data-testid="overdue-alert"
          status="error" borderRadius="md" mb="20px"
          aria-live="assertive"
        >
          <AlertIcon />
          <Box>
            <Text fontWeight="700" fontSize="sm">
              {overdueCount} trade{overdueCount !== 1 ? "s" : ""} are overdue
            </Text>
            <Text fontSize="xs" color="red.600">
              These were scheduled before today. Execute immediately to prevent settlement delays.
            </Text>
          </Box>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs colorScheme="brand" isLazy>
        <TabList mb="20px">
          <Tab data-testid="tab-sell-orders" fontWeight="600" fontSize="sm">
            Sell Orders
            {sellTotal > 0 && <Badge ml="2" colorScheme="orange" borderRadius="full">{sellTotal}</Badge>}
          </Tab>
          <Tab data-testid="tab-buy-orders" fontWeight="600" fontSize="sm">
            Buy Orders
            {buyTotal > 0 && <Badge ml="2" colorScheme="green" borderRadius="full">{buyTotal}</Badge>}
          </Tab>
          <Tab data-testid="tab-history" fontWeight="600" fontSize="sm">
            History
            {(sellFileHistory.length + buyFileHistory.length) > 0 && (
              <Badge ml="2" colorScheme="gray" borderRadius="full">
                {sellFileHistory.length + buyFileHistory.length}
              </Badge>
            )}
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel p="0">
            <OrderTabContent
              tabType="sell"
              clientGroups={sellClientGroups}
              onDownload={handleSellDownload}
              onStartBatch={handleSellStartBatch}
              onUpload={handleSellResponseUpload}   // R-004 fix: sell-scoped handler
            />
          </TabPanel>
          <TabPanel p="0">
            <OrderTabContent
              tabType="buy"
              clientGroups={buyClientGroups}
              onDownload={handleBuyDownload}
              onStartBatch={handleBuyStartBatch}
              onUpload={handleBuyResponseUpload}    // R-004 fix: buy-scoped handler
            />
          </TabPanel>
          <TabPanel p="0">
            <HistoryTab
              sellHistory={sellFileHistory}
              buyHistory={buyFileHistory}
              onRedownload={handleRedownload}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
