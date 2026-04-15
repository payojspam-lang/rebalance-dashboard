import {
  Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Progress, useColorModeValue, Input, InputGroup,
  InputLeftElement, Button, IconButton, Icon,
  Menu, MenuButton, MenuList, MenuItem, Divider,
} from "@chakra-ui/react";
import {
  createColumnHelper, flexRender,
  getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Card from "components/card/Card";
import React, { useState, useMemo, useCallback } from "react";
import { MdChevronLeft, MdChevronRight, MdSearch, MdClose, MdExpandMore } from "react-icons/md";
import StatusBadge from "./StatusBadge";
import { formatAUM } from "views/admin/user-detail/components/utils";

const PAGE_SIZE     = 25;
const columnHelper  = createColumnHelper();

const PRIORITY_CONFIG = {
  P1: { color: "red",    label: "P1" },
  P2: { color: "orange", label: "P2" },
  P3: { color: "blue",   label: "P3" },
};
const MANDATE_COLOR = { Aggressive: "purple", Moderate: "teal", Conservative: "green" };
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function dueDateMeta(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff < 0)             return { label: "Overdue",  badge: "red"    };
  if (diff < SEVEN_DAYS_MS) return { label: "Due soon", badge: "orange" };
  return                           { label: dateStr,    badge: null     };
}

const EMPTY_FILTERS = { search: "", priority: "", mandate: "", status: "", dueDate: "" };

const SORT_ICON = { asc: " ↑", desc: " ↓" };

export default function UserList({ users, onRowClick }) {
  const textColor   = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg  = useColorModeValue("blue.50", "whiteAlpha.50");

  const [filters,  setFilters]  = useState(EMPTY_FILTERS);
  const [sorting,  setSorting]  = useState([
    { id: "priority", desc: false },
  ]);
  const [page, setPage] = useState(0);

  const handleFilter = useCallback((key, val) => {
    setFilters((p) => ({ ...p, [key]: val }));
    setPage(0);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  }, []);

  // Client-side filtering
  const filtered = useMemo(() => {
    const now = new Date();
    return users.filter((u) => {
      if (filters.priority && u.priority !== filters.priority)     return false;
      if (filters.mandate  && u.riskMandate !== filters.mandate)   return false;
      if (filters.status   && u.status !== filters.status)         return false;
      if (filters.dueDate) {
        const diff = new Date(u.dueDate) - now;
        if (filters.dueDate === "overdue"   && diff >= 0)                    return false;
        if (filters.dueDate === "this_week" && (diff < 0 || diff > SEVEN_DAYS_MS)) return false;
        if (filters.dueDate === "upcoming"  && diff <= SEVEN_DAYS_MS)        return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.accountId.includes(q))  return false;
      }
      return true;
    });
  }, [users, filters]);

  const columns = useMemo(() => [
    columnHelper.accessor("priority", {
      id: "priority",
      enableSorting: true,
      sortingFn: (a, b) => {
        const order = { P1: 0, P2: 1, P3: 2 };
        return (order[a.original.priority] ?? 9) - (order[b.original.priority] ?? 9);
      },
      header: ({ column }) => (
        <Flex align="center" gap="1px" cursor="pointer" onClick={column.getToggleSortingHandler()}>
          <Text fontSize="11px" color="gray.400" userSelect="none">PRIORITY</Text>
          <Text fontSize="10px" color="gray.400">{SORT_ICON[column.getIsSorted()] ?? ""}</Text>
        </Flex>
      ),
      cell: (info) => {
        const cfg = PRIORITY_CONFIG[info.getValue()] ?? { color: "gray", label: info.getValue() };
        return <Badge colorScheme={cfg.color} borderRadius="full" px="2" fontWeight="700">{cfg.label}</Badge>;
      },
    }),
    columnHelper.accessor("name", {
      id: "name",
      enableSorting: true,
      header: ({ column }) => (
        <Flex align="center" gap="1px" cursor="pointer" onClick={column.getToggleSortingHandler()}>
          <Text fontSize="11px" color="gray.400" userSelect="none">CLIENT</Text>
          <Text fontSize="10px" color="gray.400">{SORT_ICON[column.getIsSorted()] ?? ""}</Text>
        </Flex>
      ),
      cell: (info) => (
        <Box minW="150px">
          <Text color={textColor} fontSize="sm" fontWeight="700">{info.getValue()}</Text>
          <Text color="secondaryGray.500" fontSize="10px" fontFamily="mono">{info.row.original.accountId}</Text>
        </Box>
      ),
    }),
    columnHelper.accessor("aum", {
      id: "aum",
      enableSorting: true,
      header: ({ column }) => (
        <Flex align="center" gap="1px" justify="flex-end" cursor="pointer" onClick={column.getToggleSortingHandler()}>
          <Text fontSize="11px" color="gray.400" userSelect="none">AUM</Text>
          <Text fontSize="10px" color="gray.400">{SORT_ICON[column.getIsSorted()] ?? ""}</Text>
        </Flex>
      ),
      cell: (info) => (
        <Text fontSize="sm" fontWeight="600" textAlign="right" minW="80px">{formatAUM(info.getValue())}</Text>
      ),
    }),
    columnHelper.accessor("riskMandate", {
      id: "riskMandate",
      enableSorting: true,
      header: ({ column }) => (
        <Flex align="center" gap="1px" cursor="pointer" onClick={column.getToggleSortingHandler()}>
          <Text fontSize="11px" color="gray.400" userSelect="none">MANDATE</Text>
          <Text fontSize="10px" color="gray.400">{SORT_ICON[column.getIsSorted()] ?? ""}</Text>
        </Flex>
      ),
      cell: (info) => (
        <Badge colorScheme={MANDATE_COLOR[info.getValue()] ?? "gray"} borderRadius="full" px="2">
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor("status", {
      id: "status",
      enableSorting: true,
      header: ({ column }) => (
        <Flex align="center" gap="1px" cursor="pointer" onClick={column.getToggleSortingHandler()}>
          <Text fontSize="11px" color="gray.400" userSelect="none">STATUS</Text>
          <Text fontSize="10px" color="gray.400">{SORT_ICON[column.getIsSorted()] ?? ""}</Text>
        </Flex>
      ),
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("pendingActions", {
      id: "pendingActions",
      enableSorting: true,
      header: ({ column }) => (
        <Flex align="center" gap="1px" justify="flex-end" cursor="pointer" onClick={column.getToggleSortingHandler()}>
          <Text fontSize="11px" color="gray.400" userSelect="none">PENDING</Text>
          <Text fontSize="10px" color="gray.400">{SORT_ICON[column.getIsSorted()] ?? ""}</Text>
        </Flex>
      ),
      cell: (info) => {
        const v = info.getValue();
        return (
          <Text fontSize="sm" fontWeight="700" textAlign="right"
            color={v === 0 ? "gray.300" : v > 8 ? "red.500" : "orange.400"}>
            {v === 0 ? "—" : v}
          </Text>
        );
      },
    }),
    columnHelper.accessor("dueDate", {
      id: "dueDate",
      enableSorting: true,
      header: ({ column }) => (
        <Flex align="center" gap="1px" cursor="pointer" onClick={column.getToggleSortingHandler()}>
          <Text fontSize="11px" color="gray.400" userSelect="none">DUE DATE</Text>
          <Text fontSize="10px" color="gray.400">{SORT_ICON[column.getIsSorted()] ?? ""}</Text>
        </Flex>
      ),
      cell: (info) => {
        const { label, badge } = dueDateMeta(info.getValue());
        return badge ? (
          <Badge colorScheme={badge} borderRadius="full" px="2" fontSize="xs">
            {label} · {info.getValue()}
          </Badge>
        ) : (
          <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">{label}</Text>
        );
      },
    }),
    columnHelper.accessor("lastReview", {
      id: "lastReview",
      enableSorting: true,
      header: ({ column }) => (
        <Flex align="center" gap="1px" cursor="pointer" onClick={column.getToggleSortingHandler()}>
          <Text fontSize="11px" color="gray.400" userSelect="none">LAST REVIEW</Text>
          <Text fontSize="10px" color="gray.400">{SORT_ICON[column.getIsSorted()] ?? ""}</Text>
        </Flex>
      ),
      cell: (info) => (
        <Text fontSize="sm" color="secondaryGray.600" whiteSpace="nowrap">{info.getValue()}</Text>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [textColor]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      sorting,
      pagination: { pageIndex: page, pageSize: PAGE_SIZE },
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(0);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const pageCount = table.getPageCount();
  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Pill dropdown for a single filter dimension
  function FilterPill({ field, label, options }) {
    const selected       = filters[field];
    const selectedLabel  = options.find((o) => o.val === selected)?.lbl;
    const isActive       = !!selected;
    const activeBg       = useColorModeValue("brand.500", "brand.400");
    const inactiveBorder = useColorModeValue("gray.300", "whiteAlpha.300");
    const inactiveColor  = useColorModeValue("gray.600", "gray.300");
    const hoverBg        = useColorModeValue("brand.50", "whiteAlpha.100");

    return (
      <Menu>
        <MenuButton
          as={Button}
          size="sm"
          borderRadius="full"
          rightIcon={<MdExpandMore />}
          bg={isActive ? activeBg : "transparent"}
          color={isActive ? "white" : inactiveColor}
          border="1.5px solid"
          borderColor={isActive ? activeBg : inactiveBorder}
          fontWeight={isActive ? "700" : "500"}
          fontSize="sm"
          px="14px"
          h="32px"
          _hover={{ borderColor: "brand.500", bg: isActive ? activeBg : hoverBg }}
          _active={{ bg: isActive ? activeBg : hoverBg }}
        >
          {isActive ? selectedLabel : label}
        </MenuButton>
        <MenuList zIndex="popover" minW="160px" shadow="lg" borderRadius="xl" py="4px">
          <MenuItem
            fontSize="sm"
            fontWeight="500"
            color={!selected ? "brand.500" : "inherit"}
            onClick={() => handleFilter(field, "")}
          >
            All {label}s
          </MenuItem>
          <Divider my="2px" />
          {options.map(({ val, lbl }) => (
            <MenuItem
              key={val}
              fontSize="sm"
              fontWeight={selected === val ? "700" : "400"}
              color={selected === val ? "brand.500" : "inherit"}
              onClick={() => handleFilter(field, val)}
            >
              {lbl}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    );
  }

  return (
    <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: "scroll", lg: "hidden" }}>
      {/* ── Header ── */}
      <Flex px="25px" pt="20px" pb="16px" justify="space-between" align="center">
        <Box>
          <Text color={textColor} fontSize="22px" fontWeight="700">Client List</Text>
          <Text color="secondaryGray.600" fontSize="sm">
            {filtered.length} of {users.length} clients
            {filtered.length !== users.length && " (filtered)"}
          </Text>
        </Box>
      </Flex>

      {/* ── Filter bar — single horizontal row ── */}
      <Flex
        px="25px" py="10px" gap="8px" align="center" flexWrap="wrap"
        borderTop="1px solid" borderBottom="1px solid" borderColor={borderColor}
      >
        {/* Search */}
        <InputGroup size="sm" maxW="220px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            pl="8"
            borderRadius="full"
            placeholder="Search client..."
            value={filters.search}
            onChange={(e) => handleFilter("search", e.target.value)}
            _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
          />
        </InputGroup>

        <FilterPill field="priority" label="Priority" options={[
          { val: "P1", lbl: "P1 — Immediate" },
          { val: "P2", lbl: "P2 — This Week" },
          { val: "P3", lbl: "P3 — Scheduled" },
        ]} />
        <FilterPill field="mandate" label="Mandate" options={[
          { val: "Aggressive",   lbl: "Aggressive"   },
          { val: "Moderate",     lbl: "Moderate"     },
          { val: "Conservative", lbl: "Conservative" },
        ]} />
        <FilterPill field="status" label="Status" options={[
          { val: "PENDING_REVIEW", lbl: "Pending Review" },
          { val: "IN_PROGRESS",    lbl: "In Progress"    },
          { val: "APPROVED",       lbl: "Approved"       },
          { val: "COMPLETED",      lbl: "Completed"      },
        ]} />
        <FilterPill field="dueDate" label="Due Date" options={[
          { val: "overdue",   lbl: "Overdue"       },
          { val: "this_week", lbl: "Due This Week" },
          { val: "upcoming",  lbl: "Upcoming"      },
        ]} />

        {hasActiveFilters && (
          <Button
            size="sm" variant="ghost" colorScheme="gray"
            leftIcon={<MdClose />} onClick={handleReset}
            fontSize="xs" h="32px" borderRadius="full"
          >
            Clear
          </Button>
        )}
      </Flex>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <Flex py="60px" direction="column" align="center" gap="8px">
          <Text color="secondaryGray.500" fontSize="sm">No clients match the current filters.</Text>
          <Button size="sm" variant="ghost" onClick={handleReset}>Clear filters</Button>
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" color="gray.500" mt="4px" mb="8px">
            <Thead>
              {table.getHeaderGroups().map((hg) => (
                <Tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <Th key={h.id} pe="10px" borderColor={borderColor}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody>
              {table.getRowModel().rows.map((row) => (
                <Tr key={row.id}
                  _hover={{ bg: rowHoverBg, cursor: "pointer" }}
                  onClick={() => onRowClick(row.original.id)}>
                  {row.getVisibleCells().map((cell) => (
                    <Td key={cell.id} borderColor="transparent" py="11px">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* ── Pagination ── */}
      {pageCount > 1 && (
        <Flex
          justify="space-between" align="center"
          px="25px" py="12px"
          borderTop="1px solid" borderColor={borderColor}
        >
          <Text fontSize="sm" color="secondaryGray.600">
            Page {page + 1} of {pageCount} · {filtered.length} clients
          </Text>
          <Flex gap="4px">
            <IconButton
              aria-label="First page"
              icon={<Text fontSize="xs" fontWeight="700">«</Text>}
              size="sm" variant="ghost"
              isDisabled={page === 0}
              onClick={() => setPage(0)}
            />
            <IconButton
              aria-label="Previous page"
              icon={<MdChevronLeft />}
              size="sm" variant="ghost"
              isDisabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            />
            {/* Page number buttons */}
            {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
              const mid = Math.min(Math.max(page, 2), pageCount - 3);
              const p   = pageCount <= 5 ? i : i + mid - 2;
              if (p < 0 || p >= pageCount) return null;
              return (
                <Button key={p} size="sm"
                  variant={p === page ? "solid" : "ghost"}
                  colorScheme={p === page ? "brand" : "gray"}
                  onClick={() => setPage(p)}>
                  {p + 1}
                </Button>
              );
            })}
            <IconButton
              aria-label="Next page"
              icon={<MdChevronRight />}
              size="sm" variant="ghost"
              isDisabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            />
            <IconButton
              aria-label="Last page"
              icon={<Text fontSize="xs" fontWeight="700">»</Text>}
              size="sm" variant="ghost"
              isDisabled={page >= pageCount - 1}
              onClick={() => setPage(pageCount - 1)}
            />
          </Flex>
        </Flex>
      )}
    </Card>
  );
}
