import {
  Box, Button, Flex, Table, Tbody, Td, Text, Th, Thead, Tr,
  useColorModeValue, useDisclosure, IconButton,
  Badge, useToast, Alert, AlertIcon, Divider, Tooltip,
} from "@chakra-ui/react";
import {
  createColumnHelper, flexRender,
  getCoreRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import Card from "components/card/Card";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  MdChevronLeft, MdChevronRight, MdEdit,
  MdSave, MdSend, MdRateReview,
} from "react-icons/md";

import { useRecommendations } from "contexts/RecommendationsContext";
import { navByIsin } from "../variables/mockData";
import ActionBadge from "./ActionBadge";
import FilterBar from "./FilterBar";
import FlagBadges from "./FlagBadges";
import RecommendationDetailModal from "./RecommendationDetailModal";
import StarRating from "./StarRating";

const PAGE_SIZE    = 10;
const columnHelper = createColumnHelper();

const DEVIATION_THRESHOLD_PCT = 5;

function formatINR(amount) {
  if (!amount && amount !== 0) return "—";
  if (amount === 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

function isDeviating(rec, edit) {
  if (!edit) return false;
  if (edit.action !== undefined && edit.action !== rec.mlAction) return true;
  if (edit.amount !== undefined && rec.mlAmount > 0) {
    const pct = Math.abs((edit.amount - rec.mlAmount) / rec.mlAmount) * 100;
    if (pct > DEVIATION_THRESHOLD_PCT) return true;
  }
  if (edit.qty !== undefined && rec.mlQty > 0) {
    const pct = Math.abs((edit.qty - rec.mlQty) / rec.mlQty) * 100;
    if (pct > DEVIATION_THRESHOLD_PCT) return true;
  }
  return false;
}

const EMPTY_FILTERS = { status: "", action: "", rating: "", search: "" };

const REQUEST_STATUS_META = {
  DRAFT:          { label: "Draft",           colorScheme: "gray" },
  PENDING_REVIEW: { label: "Pending Review",  colorScheme: "orange" },
  L2_REVIEW:      { label: "L2 Review",       colorScheme: "blue" },
  APPROVED:       { label: "Approved",        colorScheme: "green" },
  REJECTED:       { label: "Rejected",        colorScheme: "red" },
};

export default function RecommendationsTable({ data: allData, readOnly = false }) {
  const { isOpen, onOpen, onClose }    = useDisclosure();
  const { requestStatus, saveDraft, submitRequest, submitForReview } = useRecommendations();
  const toast = useToast();

  const [selectedRec, setSelectedRec] = useState(null);
  const [filters,     setFilters]     = useState(EMPTY_FILTERS);
  const [sorting,     setSorting]     = useState([]);
  const [page,        setPage]        = useState(0);
  // edits keyed by rec.id — tracks analyst changes over ML values
  const [edits,       setEdits]       = useState({});

  const textColor   = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg  = useColorModeValue("gray.50", "whiteAlpha.50");
  const deviatedBg  = useColorModeValue("orange.50", "orange.900");
  const changedBg   = useColorModeValue("blue.50", "blue.900");

  // Initialise edits from current data (covers page refreshes / draft loads)
  useEffect(() => {
    const init = {};
    allData.forEach((r) => {
      if (!edits[r.id]) {
        init[r.id] = {
          action: r.recommendedAction,
          amount: r.amount,
          qty:    r.qty,
          notes:  r.draftNotes ?? "",
        };
      }
    });
    if (Object.keys(init).length) {
      setEdits((prev) => ({ ...init, ...prev }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allData]);

  const totalCount     = allData.length;
  const deviationCount = useMemo(() =>
    allData.filter((r) => isDeviating(r, edits[r.id])).length,
    [allData, edits]
  );
  const changedCount = useMemo(() =>
    allData.filter((r) => edits[r.id] && (
      edits[r.id].action !== r.mlAction ||
      edits[r.id].amount !== r.mlAmount ||
      edits[r.id].qty    !== r.mlQty
    )).length,
    [allData, edits]
  );

  const updateEdit = useCallback((id, field, value) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }, []);

  const handleSaveDraft = useCallback(() => {
    saveDraft(edits);
    toast({
      title: "Saved as draft.",
      description: "Your changes have been saved. You can resume editing anytime.",
      status: "info",
      duration: 4000,
      isClosable: true,
      position: "top-right",
    });
  }, [edits, saveDraft, toast]);

  const handleSubmit = useCallback(() => {
    submitRequest(edits);
    toast({
      title: deviationCount > 0 ? "Submitted with deviations." : "Submitted.",
      description: deviationCount > 0
        ? `${deviationCount} item(s) submitted with deviations from ML.`
        : "All recommendations approved and sent for execution.",
      status: deviationCount > 0 ? "warning" : "success",
      duration: 5000,
      isClosable: true,
      position: "top-right",
    });
  }, [edits, submitRequest, deviationCount, toast]);

  const handleSubmitForReview = useCallback(() => {
    submitForReview(edits);
    toast({
      title: "Submitted.",
      description: `${totalCount} recommendation(s) submitted.`,
      status: "info",
      duration: 5000,
      isClosable: true,
      position: "top-right",
    });
  }, [edits, submitForReview, totalCount, toast]);

  // ── Filtering / pagination ────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  }, []);

  const openDetail = useCallback((rec) => {
    setSelectedRec(rec);
    onOpen();
  }, [onOpen]);

  const filtered = useMemo(() =>
    allData.filter((r) => {
      if (filters.status   && r.status !== filters.status)             return false;
      if (filters.action   && r.recommendedAction !== filters.action)   return false;
      if (filters.rating   && String(r.rating) !== filters.rating)      return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!r.assetName.toLowerCase().includes(q) && !r.isin.toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [allData, filters]
  );

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData  = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    // Fund
    columnHelper.accessor("assetName", {
      id: "assetName",
      header: () => <Text fontSize="11px" color="gray.400">FUND</Text>,
      cell: (info) => (
        <Box minW="180px" maxW="240px">
          <Text color={textColor} fontSize="sm" fontWeight="700" noOfLines={1}>
            {info.getValue()}
          </Text>
          <Text color="secondaryGray.500" fontSize="10px" fontFamily="mono">
            {info.row.original.isin}
          </Text>
        </Box>
      ),
    }),
    // Rating
    columnHelper.accessor("rating", {
      id: "rating",
      header: () => <Text fontSize="11px" color="gray.400">RATING</Text>,
      cell: (info) => <StarRating rating={info.getValue()} />,
    }),
    // ML Recommendation (read-only reference)
    columnHelper.display({
      id: "mlRec",
      header: () => (
        <Text fontSize="11px" color="gray.400" whiteSpace="nowrap">ML REC</Text>
      ),
      cell: (info) => {
        const rec = info.row.original;
        return (
          <Box minW="220px" maxW="320px">
            <Flex align="center" gap="6px" mb="5px">
              <ActionBadge action={rec.mlAction} />
              {rec.mlAmount > 0 && (
                <Text fontSize="xs" color="secondaryGray.500" whiteSpace="nowrap">
                  {formatINR(rec.mlAmount)}
                </Text>
              )}
              {rec.mlQty > 0 && (
                <Text fontSize="xs" color="secondaryGray.400" whiteSpace="nowrap">
                  · {rec.mlQty.toLocaleString("en-IN")} u
                </Text>
              )}
            </Flex>
            {rec.comment && (
              <Tooltip label={rec.comment} hasArrow placement="top" maxW="340px">
                <Text
                  fontSize="11px"
                  color="secondaryGray.500"
                  lineHeight="1.4"
                  noOfLines={2}
                  cursor="default"
                >
                  {rec.comment}
                </Text>
              </Tooltip>
            )}
          </Box>
        );
      },
    }),
    // Analyst Action (read-only — edits happen in modal)
    columnHelper.display({
      id: "yourAction",
      header: () => (
        <Text fontSize="11px" color="blue.400" fontWeight="700">ACTION</Text>
      ),
      cell: (info) => {
        const rec  = info.row.original;
        const edit = edits[rec.id] || {};
        const action = edit.action ?? rec.recommendedAction;
        const changed = edit.action !== undefined && edit.action !== rec.mlAction;
        return (
          <Flex align="center" gap="4px">
            <ActionBadge action={action} />
            {changed && <Text fontSize="9px" color="orange.400" fontWeight="700">*</Text>}
          </Flex>
        );
      },
    }),
    // Analyst Amount (read-only)
    columnHelper.display({
      id: "amount",
      header: () => (
        <Text fontSize="11px" color="blue.400" fontWeight="700" textAlign="right">AMOUNT (₹)</Text>
      ),
      cell: (info) => {
        const rec  = info.row.original;
        const edit = edits[rec.id] || {};
        const action = edit.action ?? rec.recommendedAction;
        if (action === "HOLD") return <Text fontSize="sm" color="gray.400" textAlign="right">—</Text>;
        const val = edit.amount ?? rec.amount;
        const changed = edit.amount !== undefined && edit.amount !== rec.mlAmount;
        return (
          <Text fontSize="sm" fontWeight="600" textAlign="right" minW="100px"
            color={action === "BUY" ? "green.500" : val > 0 ? "red.500" : textColor}>
            {formatINR(val)}{changed ? " *" : ""}
          </Text>
        );
      },
    }),
    // Analyst Qty (read-only)
    columnHelper.display({
      id: "qty",
      header: () => (
        <Text fontSize="11px" color="blue.400" fontWeight="700" textAlign="right">QTY</Text>
      ),
      cell: (info) => {
        const rec  = info.row.original;
        const edit = edits[rec.id] || {};
        const action = edit.action ?? rec.recommendedAction;
        if (action === "HOLD") return <Text fontSize="sm" color="gray.400" textAlign="right">—</Text>;
        const val = edit.qty ?? rec.qty;
        const changed = edit.qty !== undefined && edit.qty !== rec.mlQty;
        return (
          <Text fontSize="sm" textAlign="right" minW="80px" color="gray.600">
            {val > 0 ? val.toLocaleString("en-IN") : "—"}{changed ? " *" : ""}
          </Text>
        );
      },
    }),
    // Flags
    columnHelper.display({
      id: "flags",
      header: () => <Text fontSize="11px" color="gray.400">FLAGS</Text>,
      cell: (info) => <FlagBadges flags={info.row.original.flags} />,
    }),
    // Edit CTA
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: (info) => (
        <Button
          size="xs"
          leftIcon={<MdEdit />}
          colorScheme="brand"
          variant="outline"
          borderRadius="full"
          onClick={(e) => { e.stopPropagation(); openDetail(info.row.original); }}
        >
          Edit
        </Button>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [textColor, openDetail, updateEdit, edits, readOnly]);

  const table = useReactTable({
    data: pageData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const reqMeta = REQUEST_STATUS_META[requestStatus] ?? REQUEST_STATUS_META.PENDING_REVIEW;
  const isEditable = !readOnly;

  return (
    <>
      <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: "scroll", lg: "hidden" }}>

        {/* ── Header ── */}
        <Flex px="25px" pt="20px" pb="12px" justifyContent="space-between" align="flex-start" flexWrap="wrap" gap="8px">
          <Box>
            <Flex align="center" gap="10px" mb="4px">
              <Text color={textColor} fontSize="22px" fontWeight="700" lineHeight="1">
                Recommendations
              </Text>
              <Badge colorScheme={reqMeta.colorScheme} borderRadius="full" px="3" py="1" fontSize="xs">
                {reqMeta.label}
              </Badge>
            </Flex>
            <Text color="secondaryGray.600" fontSize="sm">
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== allData.length ? ` (filtered from ${allData.length})` : ""}
              {changedCount > 0 && (
                <Text as="span" color="orange.500" fontWeight="600">
                  {" · "}{changedCount} modified · {deviationCount} deviating
                </Text>
              )}
            </Text>
          </Box>
        </Flex>

        {/* ── Deviation info banner ── */}
        {isEditable && deviationCount > 0 && (
          <Alert status="warning" py="8px" px="25px" borderRadius="0">
            <AlertIcon />
            <Text fontSize="sm">
              <strong>{deviationCount}</strong> item{deviationCount !== 1 ? "s deviate" : " deviates"} from the ML recommendation by &gt;{DEVIATION_THRESHOLD_PCT}% —
              submitting will process them with deviations.
            </Text>
          </Alert>
        )}

        {/* ── Filter bar ── */}
        <FilterBar filters={filters} onChange={handleFilterChange} onReset={handleReset} />

        {/* ── Table ── */}
        {filtered.length === 0 ? (
          <Flex py="60px" justify="center" align="center" direction="column" gap="8px">
            <Text color="secondaryGray.500" fontSize="sm">No recommendations match the current filters.</Text>
            <Button size="sm" variant="ghost" onClick={handleReset}>Clear filters</Button>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" color="gray.500" mt="8px" mb="4px">
              <Thead>
                {table.getHeaderGroups().map((hg) => (
                  <Tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <Th key={header.id} pe="10px" borderColor={borderColor}
                        cursor={header.column.getCanSort() ? "pointer" : "default"}
                        onClick={header.column.getToggleSortingHandler()}>
                        <Flex align="center" fontSize="11px" color="gray.400">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted()] ?? null}
                        </Flex>
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody>
                {table.getRowModel().rows.map((row) => {
                  const rec      = row.original;
                  const edit     = edits[rec.id] || {};
                  const deviated = isEditable && isDeviating(rec, edit);
                  const changed  = isEditable && !deviated && (
                    edit.action !== rec.mlAction ||
                    edit.amount !== rec.mlAmount ||
                    edit.qty    !== rec.mlQty
                  );
                  const rowBg = deviated ? deviatedBg : changed ? changedBg : "transparent";
                  const leftBorder = deviated ? "3px solid" : changed ? "3px solid" : "3px solid transparent";
                  const leftBorderColor = deviated ? "orange.400" : changed ? "blue.300" : "transparent";

                  return (
                    <Tr
                      key={row.id}
                      bg={rowBg}
                      borderLeft={leftBorder}
                      borderLeftColor={leftBorderColor}
                      _hover={{ bg: deviated ? deviatedBg : changed ? changedBg : rowHoverBg }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id} fontSize="14px" borderColor="transparent" py="10px">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* ── Pagination ── */}
        {pageCount > 1 && (
          <Flex justify="space-between" align="center" px="25px" py="12px"
            borderTop="1px solid" borderColor={borderColor}>
            <Text fontSize="sm" color="secondaryGray.600">Page {page + 1} of {pageCount}</Text>
            <Flex gap="8px">
              <IconButton aria-label="Previous" icon={<MdChevronLeft />} size="sm" variant="ghost"
                isDisabled={page === 0} onClick={() => setPage((p) => p - 1)} />
              <IconButton aria-label="Next" icon={<MdChevronRight />} size="sm" variant="ghost"
                isDisabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} />
            </Flex>
          </Flex>
        )}

        {/* ── Action bar ── */}
        {isEditable && (
          <>
            <Divider />
            <Flex px="25px" py="14px" align="center" justify="space-between" flexWrap="wrap" gap="8px">
              <Text fontSize="xs" color="secondaryGray.500">
                {deviationCount > 0
                  ? `${deviationCount} deviation${deviationCount !== 1 ? "s" : ""} present`
                  : "No deviations — all items will be approved on submit"}
              </Text>
              <Flex gap="8px">
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="gray"
                  leftIcon={<MdSave />}
                  onClick={handleSaveDraft}
                >
                  Save as Draft
                </Button>

                <Button
                  size="sm"
                  colorScheme="green"
                  leftIcon={<MdSend />}
                  onClick={handleSubmit}
                >
                  Submit ({totalCount})
                </Button>
              </Flex>
            </Flex>
          </>
        )}
      </Card>

      <RecommendationDetailModal
        rec={selectedRec}
        isOpen={isOpen}
        onClose={onClose}
        readOnly={readOnly}
        nav={selectedRec ? (navByIsin[selectedRec.isin] ?? 100) : 100}
        editState={selectedRec ? edits[selectedRec.id] : null}
        onEditChange={(field, value) => selectedRec && updateEdit(selectedRec.id, field, value)}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onSubmitForReview={handleSubmitForReview}
      />
    </>
  );
}
