// ═══════════════════════════════════════════════════════════
// BSE Order File — Full 3-tab implementation
// Tabs: Sell Orders | Buy Orders | History
// ═══════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box, Flex, Text, Button, SimpleGrid, Badge, Divider,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Table, Thead, Tbody, Tr, Th, Td,
  Icon, useToast, Alert, AlertIcon, Tooltip,
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader,
  DrawerBody, DrawerCloseButton,
  Checkbox, Input, Select,
  useColorModeValue, Stat, StatLabel, StatNumber,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import {
  MdDownload, MdUpload, MdWarning, MdCloudUpload,
  MdExpandMore, MdChevronRight, MdPerson, MdSearch,
} from "react-icons/md";
import { useRecommendations } from "contexts/RecommendationsContext";
import { useBseOrders } from "contexts/BseOrderContext";
import { useHolidays } from "contexts/HolidayContext";
import {
  mockUsers,
  schemeCodeByIsin,
} from "views/admin/research-dashboard/variables/mockData";
import { surbhiRecommendations } from "views/admin/research-dashboard/variables/mockSurbhiData";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v) {
  if (!v && v !== 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(v);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function genPreviewBatchId(type) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 900 + 100);
  return `BAT-${stamp}-${type.toUpperCase()}-${rand}`;
}

function generateRemark(index) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `G${yy}${mm}${dd}W${ts}${rand}${String(index).padStart(2, "0")}`;
}

function generateBseCSV(subOrders) {
  const header = [
    "SCHEME_CODE", "Purchase / Redeem", "buy_sell type", "Client Code",
    "DP TXN Mode", "Order Amount", "Folio number", "Remark", "KYC flag",
    "Sub brocker code", "EUIN Number", "EUIN Declaration", "MIN redemption flag",
    "DPC Flag", "All units", "Redemption Units", "Sub broker ARN",
    "PG/Bank Ref.No.", "Bank account No.", "Mobile No.", "Email id", "Mandate id",
  ].join(",");

  const rows = subOrders.map((s, i) => [
    s.scheme_code,
    s.type === "buy" ? "P" : "R",
    "FRESH",
    s.client_code ?? "",
    "C",
    s.amount,
    "",
    generateRemark(i),
    "Y",
    "", "", "N", "N", "N",
    s.is_full_sell ? "Y" : "N",
    "", "", "", s.bank_account ?? "", "", s.mobile ?? "", s.email ?? "", "",
  ].join(","));

  return header + "\n" + rows.join("\n");
}

function downloadFile(content, filename, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

const STATUS_META = {
  pending:    { color: "yellow",  label: "Pending"    },
  processing: { color: "blue",    label: "Processing" },
  success:    { color: "green",   label: "Success"    },
  failed:     { color: "red",     label: "Failed"     },
  overdue:    { color: "orange",  label: "Overdue"    },
  generated:  { color: "purple",  label: "Generated"  },
  downloaded: { color: "cyan",    label: "Downloaded" },
};

function StatusBadge({ status, isOverdue }) {
  const key = isOverdue && ["pending", "processing"].includes(status) ? "overdue" : status;
  const { color, label } = STATUS_META[key] ?? { color: "gray", label: status };
  return (
    <Badge colorScheme={color} borderRadius="4px" px="2" py="0.5" fontSize="10px">
      {label}
    </Badge>
  );
}

// ── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const COLOR = { sell: "red", buy: "green", trim: "purple" };
  return (
    <Badge colorScheme={COLOR[type] ?? "gray"} borderRadius="full" px="2" fontSize="10px">
      {type?.toUpperCase()}
    </Badge>
  );
}

// ── UploadDropzone ────────────────────────────────────────────────────────────

function UploadDropzone({ onFile }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onFile(files[0]),
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const bgActive   = useColorModeValue("blue.50", "whiteAlpha.100");
  const iconColor  = useColorModeValue("gray.400", "whiteAlpha.500");

  return (
    <Box
      {...getRootProps()}
      border="2px dashed"
      borderColor={isDragActive ? "brand.500" : borderColor}
      borderRadius="md"
      p="6"
      textAlign="center"
      cursor="pointer"
      bg={isDragActive ? bgActive : "transparent"}
      transition="all 0.2s"
      _hover={{ borderColor: "brand.400" }}
    >
      <input {...getInputProps()} />
      <Icon as={MdCloudUpload} w="8" h="8" color={iconColor} mb="2" />
      <Text fontSize="sm" color="gray.500">
        {isDragActive ? "Drop file here…" : "Drag & Drop BSE Response File here"}
      </Text>
      <Text fontSize="xs" color="gray.400" mt="1">
        or{" "}
        <Text as="span" color="brand.500" textDecoration="underline" cursor="pointer">
          Browse File
        </Text>
      </Text>
      <Text fontSize="10px" color="gray.400" mt="2">Accepts: .txt  .csv  .xlsx</Text>
    </Box>
  );
}

// ── UserMultiSelect ──────────────────────────────────────────────────────────

function UserMultiSelect({ users, selectedIds, onChange }) {
  const [search, setSearch] = useState("");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const hoverBg     = useColorModeValue("gray.50",  "whiteAlpha.50");

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <Box border="1px solid" borderColor={borderColor} borderRadius="md" overflow="hidden">
      <Flex px="2" py="1" borderBottom="1px solid" borderColor={borderColor} align="center" gap="1">
        <Icon as={MdSearch} color="gray.400" w="4" h="4" />
        <Input
          size="xs"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="unstyled"
          flex="1"
        />
      </Flex>
      <Box maxH="180px" overflowY="auto">
        {filtered.map((u) => (
          <Flex
            key={u.id}
            px="3" py="2"
            align="center" gap="2"
            cursor="pointer"
            _hover={{ bg: hoverBg }}
            onClick={() => toggle(u.id)}
          >
            <Checkbox
              isChecked={selectedIds.includes(u.id)}
              onChange={() => toggle(u.id)}
              onClick={(e) => e.stopPropagation()}
              size="sm"
              colorScheme="brand"
            />
            <Text fontSize="sm">{u.name}</Text>
            <Text fontSize="xs" color="gray.400" fontFamily="mono" ml="auto">
              {u.clientCode ?? u.accountId}
            </Text>
          </Flex>
        ))}
        {filtered.length === 0 && (
          <Text fontSize="sm" color="gray.400" p="3" textAlign="center">No users found</Text>
        )}
      </Box>
      <Box px="3" py="1" borderTop="1px solid" borderColor={borderColor}>
        <Text fontSize="xs" color="gray.500">
          {selectedIds.length === 0
            ? "No users selected"
            : `${selectedIds.length} user${selectedIds.length > 1 ? "s" : ""} selected`}
        </Text>
      </Box>
    </Box>
  );
}

// ── GenerateOrderCard (Step 1) ────────────────────────────────────────────────

function GenerateOrderCard({ tabType, onGenerate }) {
  const { recommendations } = useRecommendations();
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const textColor   = useColorModeValue("gray.800", "white");
  const toast       = useToast();

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  // Stable batch ID preview per render (regenerate only on tabType change)
  const [previewBatchId] = useState(() => genPreviewBatchId(tabType));
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const availableUsers = useMemo(
    () => mockUsers.filter((u) => u.hasFullData).slice(0, 20),
    []
  );

  const getTradesForUser = useCallback(
    (user) => {
      let recs = [];
      if (user.id === "user-001") recs = recommendations;
      else if (user.id === "user-002") recs = surbhiRecommendations;

      const matchType =
        tabType === "buy"
          ? (a) => a === "BUY"
          : (a) => a === "SELL" || a === "TRIM";

      return recs
        .filter((r) => r.status === "APPROVED" && matchType(r.recommendedAction))
        .map((r) => ({
          userId:      user.id,
          userName:    user.name,
          clientCode:  user.clientCode ?? user.accountId,
          bankAccount: user.bankAccount ?? "",
          mobile:      user.mobile ?? "",
          email:       user.email ?? "",
          scheme_name: r.assetName,
          scheme_code: schemeCodeByIsin[r.isin] ?? "",
          units:       r.qty ?? 0,
          amount:      r.amount,
          type:        r.recommendedAction.toLowerCase(),
          isin:        r.isin,
        }));
    },
    [recommendations, tabType]
  );

  const previewTrades = useMemo(() => {
    if (selectedUserIds.length === 0) return [];
    return availableUsers
      .filter((u) => selectedUserIds.includes(u.id))
      .flatMap((u) => getTradesForUser(u));
  }, [selectedUserIds, availableUsers, getTradesForUser]);

  const handleDownload = () => {
    if (selectedUserIds.length === 0) {
      toast({ title: "Select at least one user.", status: "warning", duration: 3000, position: "top-right" });
      return;
    }
    if (previewTrades.length === 0) {
      toast({
        title: "No approved trades for selected users.",
        description: "Approve trades via the Rebalance workflow first.",
        status: "warning",
        duration: 4000,
        position: "top-right",
        isClosable: true,
      });
      return;
    }
    const selectedUsers = availableUsers.filter((u) => selectedUserIds.includes(u.id));
    onGenerate(previewTrades, selectedUsers);
  };

  return (
    <Card mb="20px">
      <Text fontWeight="700" fontSize="md" color={textColor} mb="4">
        Step 1 — Generate &amp; Download Order File
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4" mb="4">
        <Box>
          <Text fontSize="xs" color="gray.500" mb="1">Order Batch ID</Text>
          <Text fontSize="sm" fontFamily="mono" fontWeight="600" color={textColor}>
            {previewBatchId}
          </Text>
          <Text fontSize="10px" color="gray.400">Auto-generated</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500" mb="1">Date</Text>
          <Text fontSize="sm" color={textColor}>{today}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500" mb="1">Type</Text>
          <TypeBadge type={tabType} />
        </Box>
      </SimpleGrid>

      <Box mb="4">
        <Text fontSize="xs" color="gray.500" mb="1">Users Included</Text>
        <UserMultiSelect
          users={availableUsers}
          selectedIds={selectedUserIds}
          onChange={setSelectedUserIds}
        />
      </Box>

      {/* Preview table */}
      {previewTrades.length > 0 && (
        <Box mb="4" overflowX="auto">
          <Text fontSize="xs" color="gray.500" fontWeight="600" mb="2">
            Preview — {previewTrades.length} trade{previewTrades.length > 1 ? "s" : ""}
          </Text>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th fontSize="10px" borderColor={borderColor}>User</Th>
                <Th fontSize="10px" borderColor={borderColor}>Scheme</Th>
                <Th fontSize="10px" isNumeric borderColor={borderColor}>Units</Th>
                <Th fontSize="10px" isNumeric borderColor={borderColor}>Amount</Th>
                <Th fontSize="10px" borderColor={borderColor}>Type</Th>
              </Tr>
            </Thead>
            <Tbody>
              {previewTrades.map((t, i) => (
                <Tr key={i}>
                  <Td fontSize="sm" borderColor={borderColor}>{t.userName}</Td>
                  <Td fontSize="sm" borderColor={borderColor} maxW="180px">
                    <Text noOfLines={1}>{t.scheme_name}</Text>
                  </Td>
                  <Td fontSize="sm" isNumeric borderColor={borderColor}>
                    {t.units > 0 ? t.units.toLocaleString("en-IN") : "—"}
                  </Td>
                  <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>
                    {fmt(t.amount)}
                  </Td>
                  <Td borderColor={borderColor}><TypeBadge type={t.type} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {selectedUserIds.length > 0 && previewTrades.length === 0 && (
        <Alert status="info" borderRadius="md" mb="4" py="2">
          <AlertIcon />
          <Text fontSize="sm">
            No approved {tabType === "buy" ? "buy" : "sell / trim"} trades for selected users.
            Approve trades in the Rebalance workflow first.
          </Text>
        </Alert>
      )}

      <Button
        leftIcon={<MdDownload />}
        colorScheme="brand"
        size="sm"
        onClick={handleDownload}
        isDisabled={selectedUserIds.length === 0}
      >
        Download BSE Order File
      </Button>
    </Card>
  );
}

// ── UploadResponseCard (Step 2) ────────────────────────────────────────────────

function UploadResponseCard({ tabType, onUpload }) {
  const { batches } = useBseOrders();
  const textColor   = useColorModeValue("gray.800", "white");
  const toast       = useToast();

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [uploadedFile,    setUploadedFile]    = useState(null);

  const relevantBatches = useMemo(
    () =>
      batches.filter((b) =>
        tabType === "sell"
          ? b.type === "sell" || b.type === "trim"
          : b.type === "buy"
      ),
    [batches, tabType]
  );

  const handleUpload = () => {
    if (!selectedBatchId) {
      toast({ title: "Select a batch first.", status: "warning", duration: 3000, position: "top-right" });
      return;
    }
    if (!uploadedFile) {
      toast({ title: "No file selected.", status: "warning", duration: 3000, position: "top-right" });
      return;
    }
    onUpload(selectedBatchId, uploadedFile);
    setUploadedFile(null);
    setSelectedBatchId("");
  };

  return (
    <Card mb="20px">
      <Text fontWeight="700" fontSize="md" color={textColor} mb="4">
        Step 2 — Upload BSE Response File
      </Text>

      <Box mb="4">
        <Text fontSize="xs" color="gray.500" mb="1">Link to Batch</Text>
        <Select
          size="sm"
          placeholder="Select Batch ID…"
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
        >
          {relevantBatches.map((b) => (
            <option key={b.batch_id} value={b.batch_id}>
              {b.batch_id} — {fmtDate(b.created_at)} — {b.sub_orders.length} orders
            </option>
          ))}
        </Select>
      </Box>

      <Box mb="4">
        <UploadDropzone onFile={setUploadedFile} />
        {uploadedFile && (
          <Flex align="center" gap="1" mt="2">
            <Text fontSize="xs" color="green.500">✓ {uploadedFile.name}</Text>
            <Button size="xs" variant="link" colorScheme="gray" onClick={() => setUploadedFile(null)}>
              Remove
            </Button>
          </Flex>
        )}
      </Box>

      <Button
        leftIcon={<MdUpload />}
        colorScheme="teal"
        size="sm"
        onClick={handleUpload}
        isDisabled={!selectedBatchId || !uploadedFile}
      >
        Upload &amp; Update Status
      </Button>
    </Card>
  );
}

// ── OrderTable (shared between Sell and Buy tabs) ─────────────────────────────

function OrderTable({ orders }) {
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const textColor   = useColorModeValue("gray.800", "white");
  const overdueBg   = "rgba(255, 69, 0, 0.05)";

  if (orders.length === 0) {
    return (
      <Flex py="48px" justify="center" align="center" direction="column" gap="2">
        <Text fontSize="2xl" color="gray.300">—</Text>
        <Text fontSize="sm" color="gray.500">
          No orders yet. Generate and download an order file above.
        </Text>
      </Flex>
    );
  }

  return (
    <Box overflowX="auto">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th fontSize="10px" borderColor={borderColor}>Order ID</Th>
            <Th fontSize="10px" borderColor={borderColor}>Batch ID</Th>
            <Th fontSize="10px" borderColor={borderColor}>User</Th>
            <Th fontSize="10px" borderColor={borderColor}>Scheme</Th>
            <Th fontSize="10px" borderColor={borderColor}>Type</Th>
            <Th fontSize="10px" isNumeric borderColor={borderColor}>Units</Th>
            <Th fontSize="10px" isNumeric borderColor={borderColor}>Amount</Th>
            <Th fontSize="10px" borderColor={borderColor}>Status</Th>
            <Th fontSize="10px" borderColor={borderColor}>Order Date</Th>
            <Th fontSize="10px" borderColor={borderColor}>T+2 By</Th>
          </Tr>
        </Thead>
        <Tbody>
          {orders.map((o) => (
            <Tr
              key={o.sub_order_id}
              bg={o.is_overdue ? overdueBg : undefined}
            >
              <Td fontSize="11px" fontFamily="mono" color="gray.500" borderColor={borderColor}>
                {o.sub_order_id}
              </Td>
              <Td fontSize="11px" fontFamily="mono" color="gray.500" borderColor={borderColor}>
                {o.batch_id}
              </Td>
              <Td fontSize="sm" fontWeight="600" borderColor={borderColor}>{o.user_name}</Td>
              <Td fontSize="sm" borderColor={borderColor} maxW="160px">
                <Tooltip label={o.scheme_name} placement="top">
                  <Text noOfLines={1}>{o.scheme_name}</Text>
                </Tooltip>
              </Td>
              <Td borderColor={borderColor}><TypeBadge type={o.type} /></Td>
              <Td fontSize="sm" isNumeric borderColor={borderColor}>
                {o.units > 0 ? o.units.toFixed(3) : "—"}
              </Td>
              <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>
                {fmt(o.amount)}
              </Td>
              <Td borderColor={borderColor}>
                {o.is_overdue ? (
                  <Tooltip label={`Overdue since ${fmtDate(o.t2_date)} — T+2 breached`} placement="top">
                    <Box display="inline-block">
                      <StatusBadge status={o.status} isOverdue />
                    </Box>
                  </Tooltip>
                ) : (
                  <StatusBadge status={o.status} />
                )}
              </Td>
              <Td fontSize="xs" color="gray.500" borderColor={borderColor}>
                {fmtDate(o.order_date)}
              </Td>
              <Td fontSize="xs" color={o.is_overdue ? "orange.500" : "gray.500"} borderColor={borderColor}>
                {fmtDate(o.t2_date)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

// ── SellBuyTab ────────────────────────────────────────────────────────────────

function SellBuyTab({ tabType }) {
  const { batches, createBatch, markDownloaded, uploadResponse } = useBseOrders();
  const { getHolidaySet } = useHolidays();
  const textColor   = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const toast       = useToast();

  const subTabs = tabType === "sell" ? ["All", "Sell", "Trim"] : ["All", "Buy"];
  const [subTab, setSubTab] = useState(0);

  const allOrders = useMemo(
    () =>
      batches
        .filter((b) =>
          tabType === "sell"
            ? b.type === "sell" || b.type === "trim"
            : b.type === "buy"
        )
        .flatMap((b) => b.sub_orders),
    [batches, tabType]
  );

  const filteredOrders = useMemo(() => {
    if (subTab === 0) return allOrders;
    const want = subTabs[subTab].toLowerCase();
    return allOrders.filter((o) => o.type === want);
  }, [allOrders, subTab, subTabs]);

  const handleGenerate = useCallback(
    (trades, users) => {
      const now = new Date();
      const holidaySet = getHolidaySet(now.getFullYear());

      const batchTrades = trades.map((t) => ({
        userId:      t.userId,
        userName:    t.userName,
        assetName:   t.scheme_name,
        schemeCode:  t.scheme_code,
        qty:         t.units,
        amount:      t.amount,
        tradeType:   t.type,
        clientCode:  t.clientCode,
        bankAccount: t.bankAccount,
        mobile:      t.mobile,
        email:       t.email,
      }));

      const batch = createBatch(tabType, batchTrades, holidaySet);
      markDownloaded(batch.batch_id);

      const csv = generateBseCSV(trades.map((t) => ({ ...t, scheme_code: t.scheme_code })));
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      downloadFile(csv, `BSE_${tabType.toUpperCase()}_${dateStr}.csv`);

      toast({
        title: "Order file generated!",
        description: `${trades.length} order${trades.length > 1 ? "s" : ""} · ${batch.batch_id}`,
        status: "success",
        duration: 5000,
        position: "top-right",
        isClosable: true,
      });
    },
    [tabType, createBatch, markDownloaded, getHolidaySet, toast]
  );

  const handleUpload = useCallback(
    (batchId, file) => {
      uploadResponse(batchId, file.name);
      toast({
        title: "BSE response uploaded.",
        description: `${file.name} processed. Orders marked as Success.`,
        status: "success",
        duration: 5000,
        position: "top-right",
        isClosable: true,
      });
    },
    [uploadResponse, toast]
  );

  return (
    <Box>
      {/* Sub-tabs */}
      <Flex gap="2" mb="5">
        {subTabs.map((t, i) => (
          <Button
            key={t}
            size="xs"
            variant={subTab === i ? "solid" : "ghost"}
            colorScheme={subTab === i ? "brand" : "gray"}
            borderRadius="full"
            onClick={() => setSubTab(i)}
          >
            {t}
            <Badge
              ml="1"
              borderRadius="full"
              fontSize="9px"
              colorScheme={subTab === i ? "whiteAlpha" : "gray"}
            >
              {i === 0
                ? allOrders.length
                : allOrders.filter((o) => o.type === t.toLowerCase()).length}
            </Badge>
          </Button>
        ))}
      </Flex>

      <GenerateOrderCard tabType={tabType} onGenerate={handleGenerate} />
      <UploadResponseCard tabType={tabType} onUpload={handleUpload} />

      {/* Orders table */}
      <Card flexDirection="column" px="0">
        <Flex px="25px" pt="16px" pb="12px" align="center" justify="space-between">
          <Box>
            <Text color={textColor} fontWeight="700" fontSize="md">
              {tabType === "sell" ? "Sell / Trim Orders" : "Buy Orders"}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            </Text>
          </Box>
        </Flex>
        <Divider />
        <OrderTable orders={filteredOrders} />
      </Card>
    </Box>
  );
}

// ── OrderLevelTable (History — expandable rows) ───────────────────────────────

function OrderLevelTable({ batches }) {
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const textColor   = useColorModeValue("gray.800", "white");
  const expandedBg  = useColorModeValue("gray.50", "whiteAlpha.50");
  const toast       = useToast();

  const [expandedId, setExpandedId] = useState(null);

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  if (batches.length === 0) {
    return (
      <Flex py="48px" justify="center" align="center" direction="column" gap="2">
        <Text fontSize="2xl" color="gray.300">—</Text>
        <Text fontSize="sm" color="gray.500">No order batches found.</Text>
      </Flex>
    );
  }

  return (
    <Box overflowX="auto">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th fontSize="10px" borderColor={borderColor} w="40px" />
            <Th fontSize="10px" borderColor={borderColor}>Batch ID</Th>
            <Th fontSize="10px" borderColor={borderColor}>Type</Th>
            <Th fontSize="10px" isNumeric borderColor={borderColor}># Users</Th>
            <Th fontSize="10px" isNumeric borderColor={borderColor}># Orders</Th>
            <Th fontSize="10px" borderColor={borderColor}>Status</Th>
            <Th fontSize="10px" borderColor={borderColor}>Response Uploaded</Th>
            <Th fontSize="10px" borderColor={borderColor}>Created At</Th>
            <Th fontSize="10px" borderColor={borderColor}>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {batches.map((b) => {
            const uniqueUsers = new Set(b.sub_orders.map((s) => s.user_id)).size;
            const hasOverdue  = b.sub_orders.some((s) => s.is_overdue);
            const isExpanded  = expandedId === b.batch_id;

            return (
              <React.Fragment key={b.batch_id}>
                {/* Batch row */}
                <Tr bg={hasOverdue ? "rgba(255,69,0,0.03)" : undefined}>
                  <Td
                    borderColor={borderColor}
                    cursor="pointer"
                    onClick={() => toggle(b.batch_id)}
                    px="3"
                  >
                    <Icon
                      as={isExpanded ? MdExpandMore : MdChevronRight}
                      color="gray.500"
                      w="4" h="4"
                    />
                  </Td>
                  <Td fontSize="12px" fontFamily="mono" borderColor={borderColor}>
                    <Flex align="center" gap="1">
                      {b.batch_id}
                      {hasOverdue && (
                        <Tooltip label="Has overdue orders">
                          <Icon as={MdWarning} color="orange.500" w="3" h="3" />
                        </Tooltip>
                      )}
                    </Flex>
                  </Td>
                  <Td borderColor={borderColor}><TypeBadge type={b.type} /></Td>
                  <Td isNumeric fontSize="sm" borderColor={borderColor}>{uniqueUsers}</Td>
                  <Td isNumeric fontSize="sm" borderColor={borderColor}>{b.sub_orders.length}</Td>
                  <Td borderColor={borderColor}><StatusBadge status={b.status} /></Td>
                  <Td fontSize="xs" color="gray.500" borderColor={borderColor}>
                    {b.response_uploaded_at ? fmtDateTime(b.response_uploaded_at) : "—"}
                  </Td>
                  <Td fontSize="xs" color="gray.500" borderColor={borderColor}>
                    {fmtDateTime(b.created_at)}
                  </Td>
                  <Td borderColor={borderColor}>
                    <Button
                      size="xs"
                      variant="ghost"
                      leftIcon={<MdDownload />}
                      onClick={() =>
                        toast({
                          title: `Re-downloading ${b.batch_id}`,
                          status: "info",
                          duration: 2000,
                          position: "top-right",
                        })
                      }
                    >
                      Re-download
                    </Button>
                  </Td>
                </Tr>

                {/* Expanded sub-orders */}
                {isExpanded && (
                  <Tr>
                    <Td colSpan="9" p="0" borderColor={borderColor}>
                      <Box bg={expandedBg} px="8" py="4">
                        <Text fontSize="11px" fontWeight="700" color="gray.500" mb="2" letterSpacing="wide">
                          SUB-ORDERS IN {b.batch_id}
                        </Text>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th fontSize="10px" borderColor={borderColor}>Sub Order ID</Th>
                              <Th fontSize="10px" borderColor={borderColor}>User</Th>
                              <Th fontSize="10px" borderColor={borderColor}>Scheme</Th>
                              <Th fontSize="10px" isNumeric borderColor={borderColor}>Units</Th>
                              <Th fontSize="10px" isNumeric borderColor={borderColor}>Amount</Th>
                              <Th fontSize="10px" borderColor={borderColor}>Type</Th>
                              <Th fontSize="10px" borderColor={borderColor}>Status</Th>
                              <Th fontSize="10px" borderColor={borderColor}>BSE Ref No.</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {b.sub_orders.map((s) => (
                              <Tr
                                key={s.sub_order_id}
                                bg={s.is_overdue ? "rgba(255,69,0,0.06)" : undefined}
                              >
                                <Td fontSize="11px" fontFamily="mono" color="gray.500" borderColor={borderColor}>
                                  {s.sub_order_id}
                                </Td>
                                <Td fontSize="sm" borderColor={borderColor}>{s.user_name}</Td>
                                <Td fontSize="sm" borderColor={borderColor} maxW="160px">
                                  <Tooltip label={s.scheme_name}><Text noOfLines={1}>{s.scheme_name}</Text></Tooltip>
                                </Td>
                                <Td fontSize="sm" isNumeric borderColor={borderColor}>
                                  {s.units > 0 ? s.units.toFixed(3) : "—"}
                                </Td>
                                <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>
                                  {fmt(s.amount)}
                                </Td>
                                <Td borderColor={borderColor}><TypeBadge type={s.type} /></Td>
                                <Td borderColor={borderColor}>
                                  <StatusBadge status={s.status} isOverdue={s.is_overdue} />
                                </Td>
                                <Td fontSize="11px" fontFamily="mono" color="gray.500" borderColor={borderColor}>
                                  {s.bse_ref_no ?? "—"}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </Td>
                  </Tr>
                )}
              </React.Fragment>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}

// ── UserOrderDrawer ────────────────────────────────────────────────────────────

function UserOrderDrawer({ isOpen, onClose, userName, orders }) {
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const [statusFilter, setStatusFilter] = useState("all");
  const statusOptions = ["all", "pending", "overdue", "success", "failed"];

  const filtered = useMemo(() => {
    if (statusFilter === "all")     return orders;
    if (statusFilter === "overdue") return orders.filter((o) => o.is_overdue);
    return orders.filter((o) => o.status === statusFilter && !o.is_overdue);
  }, [orders, statusFilter]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap="2">
              <Icon as={MdPerson} color="brand.500" />
              <Text>{userName} — Order History</Text>
            </Flex>
            <DrawerCloseButton position="static" />
          </Flex>
        </DrawerHeader>

        <DrawerBody p="4">
          {/* Status filter pills */}
          <Flex gap="2" mb="4" flexWrap="wrap">
            {statusOptions.map((s) => (
              <Button
                key={s}
                size="xs"
                variant={statusFilter === s ? "solid" : "ghost"}
                colorScheme={statusFilter === s ? "brand" : "gray"}
                borderRadius="full"
                onClick={() => setStatusFilter(s)}
                textTransform="capitalize"
              >
                {s}
              </Button>
            ))}
          </Flex>

          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th fontSize="10px" borderColor={borderColor}>Order ID</Th>
                  <Th fontSize="10px" borderColor={borderColor}>Batch</Th>
                  <Th fontSize="10px" borderColor={borderColor}>Scheme</Th>
                  <Th fontSize="10px" borderColor={borderColor}>Type</Th>
                  <Th fontSize="10px" isNumeric borderColor={borderColor}>Amount</Th>
                  <Th fontSize="10px" borderColor={borderColor}>Status</Th>
                  <Th fontSize="10px" borderColor={borderColor}>Date</Th>
                  <Th fontSize="10px" borderColor={borderColor}>T+2 By</Th>
                  <Th fontSize="10px" borderColor={borderColor}>BSE Ref</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((o) => (
                  <Tr key={o.sub_order_id} bg={o.is_overdue ? "rgba(255,69,0,0.05)" : undefined}>
                    <Td fontSize="11px" fontFamily="mono" color="gray.500" borderColor={borderColor}>
                      {o.sub_order_id}
                    </Td>
                    <Td fontSize="11px" fontFamily="mono" color="gray.500" borderColor={borderColor}>
                      {o.batch_id}
                    </Td>
                    <Td fontSize="sm" borderColor={borderColor} maxW="150px">
                      <Tooltip label={o.scheme_name}><Text noOfLines={1}>{o.scheme_name}</Text></Tooltip>
                    </Td>
                    <Td borderColor={borderColor}><TypeBadge type={o.type} /></Td>
                    <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>
                      {fmt(o.amount)}
                    </Td>
                    <Td borderColor={borderColor}>
                      <StatusBadge status={o.status} isOverdue={o.is_overdue} />
                    </Td>
                    <Td fontSize="xs" color="gray.500" borderColor={borderColor}>
                      {fmtDate(o.order_date)}
                    </Td>
                    <Td
                      fontSize="xs"
                      color={o.is_overdue ? "orange.500" : "gray.500"}
                      borderColor={borderColor}
                    >
                      {fmtDate(o.t2_date)}
                    </Td>
                    <Td fontSize="11px" fontFamily="mono" color="gray.500" borderColor={borderColor}>
                      {o.bse_ref_no ?? "—"}
                    </Td>
                  </Tr>
                ))}
                {filtered.length === 0 && (
                  <Tr>
                    <Td colSpan={9} textAlign="center" py="8" color="gray.500">
                      No orders match the selected filter.
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── UserLevelView ──────────────────────────────────────────────────────────────

function UserLevelView({ batches, userIdFilter }) {
  const textColor   = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const [drawerUser, setDrawerUser] = useState(null);

  // Group all sub-orders by user
  const userMap = useMemo(() => {
    const map = {};
    batches.forEach((b) =>
      b.sub_orders.forEach((s) => {
        if (!map[s.user_id]) {
          map[s.user_id] = { user_id: s.user_id, user_name: s.user_name, orders: [] };
        }
        map[s.user_id].orders.push(s);
      })
    );
    return Object.values(map);
  }, [batches]);

  const visibleUsers = useMemo(
    () => (userIdFilter ? userMap.filter((u) => u.user_id === userIdFilter) : userMap),
    [userMap, userIdFilter]
  );

  const drawerOrders = useMemo(() => {
    if (!drawerUser) return [];
    return userMap.find((u) => u.user_id === drawerUser.user_id)?.orders ?? [];
  }, [drawerUser, userMap]);

  if (visibleUsers.length === 0) {
    return (
      <Flex py="48px" justify="center" align="center" direction="column" gap="2">
        <Text fontSize="2xl" color="gray.300">—</Text>
        <Text fontSize="sm" color="gray.500">No users found.</Text>
      </Flex>
    );
  }

  return (
    <>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
        {visibleUsers.map((u) => {
          const pending = u.orders.filter((o) => o.status === "pending" && !o.is_overdue).length;
          const overdue = u.orders.filter((o) => o.is_overdue).length;
          const success = u.orders.filter((o) => o.status === "success").length;
          const lastOrder = u.orders.reduce(
            (latest, o) => (!latest || o.order_date > latest.order_date ? o : latest),
            null
          );

          return (
            <Card key={u.user_id} p="4">
              <Flex align="center" justify="space-between" mb="3">
                <Flex align="center" gap="2">
                  <Icon as={MdPerson} color="brand.500" w="5" h="5" />
                  <Text fontWeight="700" color={textColor}>{u.user_name}</Text>
                </Flex>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="brand"
                  rightIcon={<MdChevronRight />}
                  onClick={() => setDrawerUser(u)}
                >
                  View All Orders
                </Button>
              </Flex>

              <Divider mb="3" />

              <Flex gap="1" align="center" mb="2" flexWrap="wrap">
                <Text fontSize="sm" color="gray.500">
                  Total: <Text as="span" fontWeight="700" color={textColor}>{u.orders.length}</Text>
                </Text>
                {overdue > 0 && (
                  <Badge colorScheme="orange" borderRadius="full" ml="1">
                    ⚠️ Overdue: {overdue}
                  </Badge>
                )}
              </Flex>

              <Flex gap="2" flexWrap="wrap">
                <Badge colorScheme="green"  borderRadius="full">✓ Success: {success}</Badge>
                <Badge colorScheme="yellow" borderRadius="full">⏱ Pending: {pending}</Badge>
                {overdue > 0 && (
                  <Badge colorScheme="orange" borderRadius="full">🔴 Overdue: {overdue}</Badge>
                )}
              </Flex>

              {lastOrder && (
                <Text fontSize="xs" color="gray.400" mt="3">
                  Last activity: {fmtDate(lastOrder.order_date)}
                </Text>
              )}
            </Card>
          );
        })}
      </SimpleGrid>

      {drawerUser && (
        <UserOrderDrawer
          isOpen={!!drawerUser}
          onClose={() => setDrawerUser(null)}
          userName={drawerUser.user_name}
          orders={drawerOrders}
        />
      )}
    </>
  );
}

// ── HistoryTab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const { batches } = useBseOrders();
  const textColor   = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const [viewMode, setViewMode] = useState("order");
  const [filters,  setFilters]  = useState({ from: "", to: "", userId: "", type: "", search: "" });

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const clearFilters = () => setFilters({ from: "", to: "", userId: "", type: "", search: "" });
  const hasFilters = Object.values(filters).some(Boolean);

  // Unique users across all batches
  const allUsers = useMemo(() => {
    const map = {};
    batches.forEach((b) =>
      b.sub_orders.forEach((s) => { map[s.user_id] = s.user_name; })
    );
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [batches]);

  const filteredBatches = useMemo(() =>
    batches.filter((b) => {
      if (filters.type && b.type !== filters.type) return false;
      if (filters.from && b.created_at.slice(0, 10) < filters.from) return false;
      if (filters.to   && b.created_at.slice(0, 10) > filters.to)   return false;
      if (filters.userId && !b.sub_orders.some((s) => s.user_id === filters.userId)) return false;
      if (filters.search && !b.batch_id.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    }),
  [batches, filters]);

  return (
    <Box>
      {/* Filters */}
      <Card mb="4">
        <Flex gap="3" align="flex-end" flexWrap="wrap">
          <Box flex="1" minW="120px">
            <Text fontSize="xs" color="gray.500" mb="1">From</Text>
            <Input size="sm" type="date" value={filters.from}
              onChange={(e) => setFilter("from", e.target.value)} />
          </Box>
          <Box flex="1" minW="120px">
            <Text fontSize="xs" color="gray.500" mb="1">To</Text>
            <Input size="sm" type="date" value={filters.to}
              onChange={(e) => setFilter("to", e.target.value)} />
          </Box>
          <Box flex="1" minW="130px">
            <Text fontSize="xs" color="gray.500" mb="1">User</Text>
            <Select size="sm" placeholder="All Users" value={filters.userId}
              onChange={(e) => setFilter("userId", e.target.value)}>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </Box>
          <Box flex="1" minW="100px">
            <Text fontSize="xs" color="gray.500" mb="1">Type</Text>
            <Select size="sm" placeholder="All Types" value={filters.type}
              onChange={(e) => setFilter("type", e.target.value)}>
              <option value="sell">Sell</option>
              <option value="buy">Buy</option>
              <option value="trim">Trim</option>
            </Select>
          </Box>
          <Box flex="2" minW="150px">
            <Text fontSize="xs" color="gray.500" mb="1">Search Batch ID</Text>
            <Input size="sm" placeholder="Search…" value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)} />
          </Box>
          {hasFilters && (
            <Button size="sm" variant="ghost" colorScheme="gray" onClick={clearFilters} flexShrink={0}>
              Clear
            </Button>
          )}
        </Flex>
      </Card>

      {/* View toggle */}
      <Flex gap="2" mb="5">
        <Button
          size="sm"
          variant={viewMode === "order" ? "solid" : "outline"}
          colorScheme="brand"
          onClick={() => setViewMode("order")}
        >
          Order Level
        </Button>
        <Button
          size="sm"
          variant={viewMode === "user" ? "solid" : "outline"}
          colorScheme="brand"
          onClick={() => setViewMode("user")}
        >
          User Level
        </Button>
      </Flex>

      {viewMode === "order" ? (
        <Card flexDirection="column" px="0">
          <Flex px="25px" pt="16px" pb="12px" align="center" justify="space-between">
            <Box>
              <Text color={textColor} fontWeight="700" fontSize="md">Order Batches</Text>
              <Text fontSize="xs" color="gray.500">
                {filteredBatches.length} batch{filteredBatches.length !== 1 ? "es" : ""}
                {hasFilters ? " (filtered)" : ""}
              </Text>
            </Box>
          </Flex>
          <Divider />
          <OrderLevelTable batches={filteredBatches} />
        </Card>
      ) : (
        <UserLevelView batches={filteredBatches} userIdFilter={filters.userId} />
      )}
    </Box>
  );
}

// ── BseOrderFile (main export) ────────────────────────────────────────────────

export default function BseOrderFile() {
  const { batches } = useBseOrders();
  const textColor = useColorModeValue("gray.800", "white");
  const statBg    = useColorModeValue("white", "navy.800");

  const allSubOrders = useMemo(() => batches.flatMap((b) => b.sub_orders), [batches]);
  const overdueCount = useMemo(() => allSubOrders.filter((o) => o.is_overdue).length, [allSubOrders]);
  const pendingCount = useMemo(() => allSubOrders.filter((o) => o.status === "pending" && !o.is_overdue).length, [allSubOrders]);
  const successCount = useMemo(() => allSubOrders.filter((o) => o.status === "success").length, [allSubOrders]);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Overdue Banner */}
      {overdueCount > 0 && (
        <Alert
          status="warning"
          borderRadius="md"
          mb="4"
          borderWidth="1px"
          borderColor="orange.300"
        >
          <AlertIcon />
          <Text fontSize="sm">
            <Text as="strong">⚠️ {overdueCount} order{overdueCount > 1 ? "s" : ""} overdue</Text>
            {" "}— T+2 settlement deadline breached. Upload BSE response or take manual action.
          </Text>
        </Alert>
      )}

      {/* Summary Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap="20px" mb="20px">
        <Stat bg={statBg} borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Total Batches</StatLabel>
          <StatNumber fontSize="2xl" color={textColor}>{batches.length}</StatNumber>
        </Stat>
        <Stat bg={statBg} borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Pending Orders</StatLabel>
          <StatNumber fontSize="2xl" color="yellow.500">{pendingCount}</StatNumber>
        </Stat>
        <Stat bg={statBg} borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Overdue</StatLabel>
          <StatNumber fontSize="2xl" color="orange.500">{overdueCount}</StatNumber>
        </Stat>
        <Stat bg={statBg} borderRadius="lg" p="16px" shadow="sm">
          <StatLabel fontSize="xs" color="gray.500">Completed</StatLabel>
          <StatNumber fontSize="2xl" color="green.500">{successCount}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Main 3-tab bar */}
      <Tabs colorScheme="brand" isLazy>
        <TabList mb="24px">
          <Tab fontWeight="600" fontSize="sm">Sell Orders</Tab>
          <Tab fontWeight="600" fontSize="sm">Buy Orders</Tab>
          <Tab fontWeight="600" fontSize="sm">History</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p="0"><SellBuyTab tabType="sell" /></TabPanel>
          <TabPanel p="0"><SellBuyTab tabType="buy"  /></TabPanel>
          <TabPanel p="0"><HistoryTab /></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
