import {
  Box, Flex, Text, Button, SimpleGrid, Stat, StatLabel, StatNumber,
  useColorModeValue, Badge, Divider, Table, Thead, Tbody, Tr, Th, Td,
  Collapse, Icon, useToast, Alert, AlertIcon, Input,
  Tabs, TabList, Tab, TabPanels, TabPanel,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useMemo, useCallback, useState, useRef } from "react";
import {
  MdDownload, MdPlayArrow, MdCheckCircle, MdUpload,
  MdExpandMore, MdChevronRight, MdInsertDriveFile, MdCalendarToday,
} from "react-icons/md";

import { useRecommendations } from "contexts/RecommendationsContext";
import { mockUsers, schemeCodeByIsin } from "views/admin/research-dashboard/variables/mockData";
import { mockSellSchedule, mockBuySchedule } from "views/admin/research-dashboard/variables/mockScheduleData";
import ActionBadge from "views/admin/research-dashboard/components/ActionBadge";

// ── Constants ─────────────────────────────────────────────────────────────────

// Earliest sell date per ISIN (from lot-level schedule)
const sellDateByIsin = mockSellSchedule.reduce((acc, row) => {
  if (!acc[row.isin] || row.bestSellDate < acc[row.isin]) acc[row.isin] = row.bestSellDate;
  return acc;
}, {});

// Earliest buy date per ISIN (from buy schedule)
const buyDateByIsin = mockBuySchedule.reduce((acc, row) => {
  if (!acc[row.isin] || row.buyDate < acc[row.isin]) acc[row.isin] = row.buyDate;
  return acc;
}, {});

// Today as YYYY-MM-DD — used for "Today" vs "Upcoming" bucketing
const TODAY = new Date().toISOString().slice(0, 10);

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(v) {
  if (!v && v !== 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(v);
}

function fmtAUM(v) {
  if (!v) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

/** "2026-04-16" → "Apr 16" */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** "2026-04-16" → "Apr 16, 2026" */
function fmtDateLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const MANDATE_COLOR = { Aggressive: "purple", Moderate: "teal", Conservative: "green" };

function generateRemark(index) {
  const now  = new Date();
  const yy   = String(now.getFullYear()).slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");
  const ts   = Date.now();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `G${yy}${mm}${dd}W${ts}${rand}${String(index).padStart(2, "0")}`;
}

function generateBseCSV(trades) {
  const header = [
    "SCHEME_CODE", "Purchase / Redeem", "buy_sell type", "Client Code",
    "DP TXN Mode", "Order Amount", "Folio number", "Remark", "KYC flag",
    "Sub brocker code", "EUIN Number", "EUIN Declaration", "MIN redemption flag",
    "DPC Flag", "All units", "Redemption Units", "Sub broker ARN",
    "PG/Bank Ref.No.", "Bank account No.", "Mobile No.", "Email id", "Mandate id",
  ].join(",");

  const rows = trades.map((t, i) => {
    const schemeCode     = schemeCodeByIsin[t.isin] ?? "";
    const purchaseRedeem = t.action === "BUY" ? "P" : "R";
    const allUnits       = t.action !== "BUY" && t.isFullSell ? "Y" : "N";
    return [
      schemeCode, purchaseRedeem, "FRESH", t.clientCode ?? "",
      "C", t.amount, "", generateRemark(i), "Y",
      "", "", "N", "N", "N", allUnits, "", "",
      "", t.bankAccount ?? "", "", t.mobile ?? "", t.email ?? "", "",
    ].join(",");
  });

  return header + "\n" + rows.join("\n");
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href  = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Trade row (with Exec Date column) ────────────────────────────────────────
function TradeRow({ trade, borderColor }) {
  const isToday = trade.executionDate <= TODAY;
  return (
    <Tr>
      <Td fontSize="sm" borderColor={borderColor}>
        <Box>
          <Text fontWeight="600" noOfLines={1}>{trade.assetName}</Text>
          <Text fontSize="10px" color="gray.500" fontFamily="mono">{trade.isin}</Text>
        </Box>
      </Td>
      <Td fontSize="sm" borderColor={borderColor}><ActionBadge action={trade.action} /></Td>
      <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>{fmt(trade.amount)}</Td>
      <Td fontSize="sm" isNumeric borderColor={borderColor}>
        {trade.qty?.toLocaleString("en-IN") ?? "—"}
      </Td>
      <Td fontSize="sm" borderColor={borderColor} fontFamily="mono" color="gray.500">
        {schemeCodeByIsin[trade.isin] ?? "—"}
      </Td>
      <Td fontSize="sm" borderColor={borderColor}>
        <Badge
          colorScheme={isToday ? "green" : "blue"}
          variant="subtle"
          borderRadius="full"
          fontSize="xs"
          px="2"
        >
          {isToday ? `Today · ${fmtDate(trade.executionDate)}` : fmtDate(trade.executionDate)}
        </Badge>
      </Td>
    </Tr>
  );
}

// ── Client accordion card ─────────────────────────────────────────────────────
function ClientCard({ user, trades, borderColor }) {
  const [expanded, setExpanded] = useState(false);
  const textColor = useColorModeValue("gray.800", "white");
  const hoverBg   = useColorModeValue("blue.50", "whiteAlpha.50");
  const totalAmt  = trades.reduce((s, t) => s + (t.amount ?? 0), 0);

  // Earliest execution date for this client in this batch
  const execDate = trades.reduce(
    (min, t) => (!min || t.executionDate < min ? t.executionDate : min),
    null,
  );
  const execIsToday = execDate && execDate <= TODAY;

  return (
    <Box borderBottom="1px solid" borderColor={borderColor}>
      <Flex
        px="25px" py="14px" align="center" gap="12px" cursor="pointer"
        _hover={{ bg: hoverBg }} onClick={() => setExpanded((p) => !p)} flexWrap="wrap"
      >
        <Icon as={expanded ? MdExpandMore : MdChevronRight}
          color="gray.500" w="16px" h="16px" flexShrink={0} />
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
        {/* Execution date badge */}
        {execDate && (
          <Flex align="center" gap="4px">
            <Icon as={MdCalendarToday} color={execIsToday ? "green.500" : "blue.400"} w="13px" h="13px" />
            <Badge
              colorScheme={execIsToday ? "green" : "blue"}
              variant="subtle"
              borderRadius="full"
              px="2"
              fontSize="xs"
            >
              {execIsToday ? `Today · ${fmtDate(execDate)}` : fmtDate(execDate)}
            </Badge>
          </Flex>
        )}
        <Badge colorScheme="green" borderRadius="full" px="2">
          {trades.length} trade{trades.length !== 1 ? "s" : ""}
        </Badge>
        <Text fontSize="sm" color="green.500" fontWeight="700">{fmt(totalAmt)}</Text>
      </Flex>
      <Collapse in={expanded} animateOpacity>
        <Box px="25px" pb="12px">
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
              {trades.map((t) => <TradeRow key={t.isin + t.executionDate} trade={t} borderColor={borderColor} />)}
            </Tbody>
          </Table>
        </Box>
      </Collapse>
    </Box>
  );
}

// ── Date section sub-header (inside Upcoming) ─────────────────────────────────
function DateSubHeader({ date, tradeCount, borderColor, sectionBg }) {
  return (
    <Flex
      px="25px" py="10px"
      bg={sectionBg}
      borderBottom="1px solid" borderColor={borderColor}
      align="center" gap="8px"
    >
      <Icon as={MdCalendarToday} color="blue.400" w="14px" h="14px" />
      <Text fontSize="sm" fontWeight="700" color="blue.500">{fmtDateLong(date)}</Text>
      <Badge colorScheme="blue" variant="outline" borderRadius="full" fontSize="xs" px="2">
        {tradeCount} trade{tradeCount !== 1 ? "s" : ""}
      </Badge>
    </Flex>
  );
}

// ── Two-section grouped trade list (Today + Upcoming) ────────────────────────
function GroupedTradesList({ clientGroups, emptyMessage, inProgressCount, completedCount }) {
  const textColor   = useColorModeValue("gray.800", "white");
  const subColor    = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const sectionBg   = useColorModeValue("gray.50", "navy.900");

  // Partition into today (executionDate ≤ TODAY) and upcoming (> TODAY)
  const { todayGroups, upcomingDates } = useMemo(() => {
    const _todayGroups = [];
    const dateMap = {}; // date → { userId → { user, trades[] } }

    for (const { user, trades } of clientGroups) {
      const todayTrades  = trades.filter((t) => t.executionDate <= TODAY);
      const futureTrades = trades.filter((t) => t.executionDate > TODAY);

      if (todayTrades.length > 0) _todayGroups.push({ user, trades: todayTrades });

      for (const trade of futureTrades) {
        const d = trade.executionDate;
        if (!dateMap[d]) dateMap[d] = {};
        if (!dateMap[d][user.id]) dateMap[d][user.id] = { user, trades: [] };
        dateMap[d][user.id].trades.push(trade);
      }
    }

    const _upcomingDates = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, userMap]) => ({ date, groups: Object.values(userMap) }));

    return { todayGroups: _todayGroups, upcomingDates: _upcomingDates };
  }, [clientGroups]);

  const todayTradeCount    = todayGroups.reduce((s, g) => s + g.trades.length, 0);
  const upcomingTradeCount = upcomingDates.reduce(
    (s, d) => s + d.groups.reduce((ss, g) => ss + g.trades.length, 0), 0,
  );
  const hasAny = todayGroups.length > 0 || upcomingDates.length > 0;

  if (!hasAny) {
    return (
      <Card flexDirection="column" w="100%" px="0px">
        <Flex py="60px" justify="center" align="center" direction="column" gap="8px">
          <Text fontSize="2xl">{inProgressCount > 0 || completedCount > 0 ? "⏳" : "—"}</Text>
          <Text color={subColor} fontSize="sm">{emptyMessage}</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <>
      {/* ── Section 1: Today ── */}
      <Card flexDirection="column" w="100%" px="0px" mb="20px">
        <Flex px="25px" pt="20px" pb="16px" align="center" justify="space-between">
          <Box>
            <Flex align="center" gap="8px">
              <Text color={textColor} fontSize="lg" fontWeight="700">Execution Date: Today</Text>
              <Badge colorScheme="green" borderRadius="full" px="2">{fmtDateLong(TODAY)}</Badge>
            </Flex>
            <Text color={subColor} fontSize="sm" mt="2px">
              {todayGroups.length === 0
                ? "No trades are scheduled for today's execution window."
                : `${todayGroups.length} client${todayGroups.length > 1 ? "s" : ""} · ${todayTradeCount} trade${todayTradeCount !== 1 ? "s" : ""} ready to batch`}
            </Text>
          </Box>
          {todayTradeCount > 0 && (
            <Badge colorScheme="green" fontSize="sm" borderRadius="full" px="3" py="1">
              {fmt(todayGroups.reduce((s, g) => s + g.trades.reduce((ts, t) => ts + (t.amount ?? 0), 0), 0))}
            </Badge>
          )}
        </Flex>
        <Divider />
        {todayGroups.length === 0 ? (
          <Flex py="40px" justify="center" align="center">
            <Text color={subColor} fontSize="sm">
              No trades are scheduled for today's execution window.
            </Text>
          </Flex>
        ) : (
          todayGroups.map(({ user, trades }) => (
            <ClientCard key={user.id} user={user} trades={trades} borderColor={borderColor} />
          ))
        )}
      </Card>

      {/* ── Section 2: Upcoming ── */}
      {upcomingDates.length > 0 && (
        <Card flexDirection="column" w="100%" px="0px">
          <Flex px="25px" pt="20px" pb="16px" align="center" justify="space-between">
            <Box>
              <Flex align="center" gap="8px">
                <Text color={textColor} fontSize="lg" fontWeight="700">Upcoming</Text>
                <Badge colorScheme="blue" variant="subtle" borderRadius="full" px="2">
                  {upcomingDates.length} date{upcomingDates.length > 1 ? "s" : ""}
                </Badge>
              </Flex>
              <Text color={subColor} fontSize="sm" mt="2px">
                {upcomingTradeCount} trade{upcomingTradeCount !== 1 ? "s" : ""} across future execution windows
              </Text>
            </Box>
          </Flex>
          <Divider />
          {upcomingDates.map(({ date, groups }) => {
            const dateTradeCount = groups.reduce((s, g) => s + g.trades.length, 0);
            return (
              <Box key={date}>
                <DateSubHeader
                  date={date}
                  tradeCount={dateTradeCount}
                  borderColor={borderColor}
                  sectionBg={sectionBg}
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

// ── Shared tab content (Sell or Buy) ──────────────────────────────────────────
function OrderTabContent({ tabType, clientGroups, fileHistory, onDownload, onStartBatch, onUpload, onRedownload }) {
  const textColor    = useColorModeValue("gray.800", "white");
  const fileInputRef = useRef(null);

  const { allUserRecs } = useRecommendations();
  const allRecs = useMemo(() => Object.values(allUserRecs).flat(), [allUserRecs]);

  const inProgressCount = useMemo(
    () => allRecs.filter((r) => r.status === "IN_PROGRESS").length,
    [allRecs],
  );
  const completedCount = useMemo(
    () => allRecs.filter((r) => r.status === "COMPLETED").length,
    [allRecs],
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
      : `Approve trades from the Rebalance workflow to see them here.`;

  return (
    <>
      {/* Execution Hub */}
      <Card mb="20px" p="16px">
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
            <Button size="sm" leftIcon={<MdDownload />} variant="outline" colorScheme="gray"
              isDisabled={totalTrades === 0} onClick={onDownload}>
              Download CSV
            </Button>
            <Button size="sm" leftIcon={<MdPlayArrow />} colorScheme="brand"
              isDisabled={totalTrades === 0} onClick={onStartBatch}>
              Start Batch
            </Button>
            <Divider orientation="vertical" h="30px" mx="4px" />
            <Button size="sm" leftIcon={<MdUpload />} colorScheme="teal" variant="outline"
              isDisabled={inProgressCount === 0} onClick={() => fileInputRef.current?.click()}>
              Upload BSE Response
            </Button>
            <Input ref={fileInputRef} type="file" accept=".csv,.txt"
              display="none" onChange={onUpload} />
          </Flex>
        </Flex>
      </Card>

      {/* In-progress banner */}
      {inProgressCount > 0 && (
        <Alert status="info" borderRadius="md" mb="20px">
          <AlertIcon />
          <Text fontSize="sm">
            <strong>{inProgressCount} order{inProgressCount !== 1 ? "s" : ""}</strong> sent to BSE Star.
            Upload the BSE response file to confirm placement.
          </Text>
        </Alert>
      )}

      {/* Today + Upcoming sections */}
      <GroupedTradesList
        clientGroups={clientGroups}
        emptyMessage={emptyMessage}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
      />
    </>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────
function HistoryTab({ sellHistory, buyHistory, onRedownload }) {
  const textColor   = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const combined = [...sellHistory, ...buyHistory].sort((a, b) => b.id - a.id);

  if (combined.length === 0) {
    return (
      <Flex py="60px" justify="center" align="center" direction="column" gap="8px">
        <Text fontSize="2xl">—</Text>
        <Text color="gray.500" fontSize="sm">
          No files generated yet. Use Sell Orders or Buy Orders tab to download a BSE file.
        </Text>
      </Flex>
    );
  }

  return (
    <Card flexDirection="column" w="100%" px="0px">
      <Flex px="25px" pt="16px" pb="12px" align="center" gap="8px">
        <Icon as={MdInsertDriveFile} color="gray.500" />
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
              <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>{fmt(entry.totalAmount)}</Td>
              <Td borderColor={borderColor}>
                <Button size="xs" variant="ghost" leftIcon={<MdDownload />}
                  onClick={() => onRedownload(entry)}>
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

// ── Main BSE Order File page ──────────────────────────────────────────────────
export default function BseOrderFile() {
  const { allUserRecs, startBatch, completeBatch } = useRecommendations();
  const toast     = useToast();
  const textColor = useColorModeValue("gray.800", "white");

  const [sellFileHistory, setSellFileHistory] = useState([]);
  const [buyFileHistory,  setBuyFileHistory]  = useState([]);

  // Build user lookup once
  const userById = useMemo(
    () => Object.fromEntries(mockUsers.map((u) => [u.id, u])),
    [],
  );

  // Build flat trade list from all users, enriched with executionDate
  const buildTrades = useCallback((recs, user, tabType) => {
    const dateMap = tabType === "sell" ? sellDateByIsin : buyDateByIsin;
    return recs
      .filter((r) => {
        if (r.status !== "APPROVED" || r.recommendedAction === "HOLD") return false;
        if (tabType === "sell") return r.recommendedAction === "SELL" || r.recommendedAction === "TRIM";
        return r.recommendedAction === "BUY";
      })
      .map((r) => ({
        isin:          r.isin,
        assetName:     r.assetName,
        action:        r.recommendedAction,
        amount:        r.amount,
        qty:           r.qty ?? 0,
        isFullSell:    r.amount === r.currentValue,
        executionDate: dateMap[r.isin] ?? TODAY,
        clientCode:    user.clientCode ?? user.accountId,
        bankAccount:   user.bankAccount ?? "",
        mobile:        user.mobile ?? "",
        email:         user.email ?? "",
      }));
  }, []);

  const sellClientGroups = useMemo(() => {
    const groups = [];
    for (const [userId, recs] of Object.entries(allUserRecs)) {
      const user   = userById[userId];
      if (!user) continue;
      const trades = buildTrades(recs, user, "sell");
      if (trades.length > 0) groups.push({ user, trades });
    }
    return groups;
  }, [allUserRecs, userById, buildTrades]);

  const buyClientGroups = useMemo(() => {
    const groups = [];
    for (const [userId, recs] of Object.entries(allUserRecs)) {
      const user   = userById[userId];
      if (!user) continue;
      const trades = buildTrades(recs, user, "buy");
      if (trades.length > 0) groups.push({ user, trades });
    }
    return groups;
  }, [allUserRecs, userById, buildTrades]);

  const allRecs         = useMemo(() => Object.values(allUserRecs).flat(), [allUserRecs]);
  const inProgressCount = useMemo(() => allRecs.filter((r) => r.status === "IN_PROGRESS").length, [allRecs]);
  const completedCount  = useMemo(() => allRecs.filter((r) => r.status === "COMPLETED").length, [allRecs]);

  // ── Generic download handler ──────────────────────────────────────────────
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

  const handleSellDownload = useCallback(
    () => handleDownload(sellClientGroups, "sell", setSellFileHistory),
    [handleDownload, sellClientGroups],
  );
  const handleSellStartBatch = useCallback(() => {
    const entry = handleSellDownload();
    if (entry) {
      startBatch();
      toast({ title: "Batch started.", description: "Orders moved to In Progress.", status: "info", duration: 5000, isClosable: true, position: "top-right" });
    }
  }, [handleSellDownload, startBatch, toast]);

  const handleBuyDownload = useCallback(
    () => handleDownload(buyClientGroups, "buy", setBuyFileHistory),
    [handleDownload, buyClientGroups],
  );
  const handleBuyStartBatch = useCallback(() => {
    const entry = handleBuyDownload();
    if (entry) {
      startBatch();
      toast({ title: "Batch started.", description: "Orders moved to In Progress.", status: "info", duration: 5000, isClosable: true, position: "top-right" });
    }
  }, [handleBuyDownload, startBatch, toast]);

  const handleResponseUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    completeBatch();
    toast({
      title: "BSE response uploaded.",
      description: `${file.name} processed. All in-progress orders marked as Completed.`,
      status: "success", duration: 5000, isClosable: true, position: "top-right",
    });
    if (e.target) e.target.value = "";
  }, [completeBatch, toast]);

  const handleRedownload = useCallback((entry) => {
    downloadCSV(entry.csv, entry.filename);
    toast({ title: `Re-downloaded ${entry.filename}`, status: "info", duration: 2000, isClosable: true, position: "top-right" });
  }, [toast]);

  const sellTotal = sellClientGroups.reduce((s, g) => s + g.trades.length, 0);
  const buyTotal  = buyClientGroups.reduce((s, g) => s + g.trades.length, 0);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Summary stats */}
      <SimpleGrid columns={{ base: 1, md: 4 }} gap="20px" mb="20px">
        <Stat bg="white" borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Clients Ready</StatLabel>
          <StatNumber fontSize="2xl" color="green.500">
            {new Set([...sellClientGroups, ...buyClientGroups].map((g) => g.user.id)).size}
          </StatNumber>
        </Stat>
        <Stat bg="white" borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Approved Trades</StatLabel>
          <StatNumber fontSize="2xl" color={textColor}>{sellTotal + buyTotal}</StatNumber>
        </Stat>
        <Stat bg="white" borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">In Progress</StatLabel>
          <StatNumber fontSize="2xl" color="blue.500">{inProgressCount}</StatNumber>
        </Stat>
        <Stat bg="white" borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Completed</StatLabel>
          <StatNumber fontSize="2xl" color="gray.400">{completedCount}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Tabs */}
      <Tabs colorScheme="brand" isLazy>
        <TabList mb="20px">
          <Tab fontWeight="600" fontSize="sm">
            Sell Orders
            {sellTotal > 0 && <Badge ml="2" colorScheme="orange" borderRadius="full">{sellTotal}</Badge>}
          </Tab>
          <Tab fontWeight="600" fontSize="sm">
            Buy Orders
            {buyTotal > 0 && <Badge ml="2" colorScheme="green" borderRadius="full">{buyTotal}</Badge>}
          </Tab>
          <Tab fontWeight="600" fontSize="sm">
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
              fileHistory={sellFileHistory}
              onDownload={handleSellDownload}
              onStartBatch={handleSellStartBatch}
              onUpload={handleResponseUpload}
              onRedownload={handleRedownload}
            />
          </TabPanel>

          <TabPanel p="0">
            <OrderTabContent
              tabType="buy"
              clientGroups={buyClientGroups}
              fileHistory={buyFileHistory}
              onDownload={handleBuyDownload}
              onStartBatch={handleBuyStartBatch}
              onUpload={handleResponseUpload}
              onRedownload={handleRedownload}
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
