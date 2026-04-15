import {
  Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, useColorModeValue, Stat, StatLabel, StatNumber, SimpleGrid,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useState } from "react";
import {
  createColumnHelper, flexRender, getCoreRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table";

const columnHelper = createColumnHelper();

function fmt(v) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

const RULE_LABELS = {
  "R_LOCKIN_FREE_SELL":       { label: "Lock-in Free", color: "purple" },
  "R5_3star_zero_if_45_in_cat": { label: "Rating Overlap", color: "red" },
  "R3_cap_to_5pct":           { label: "3★ Cap", color: "orange" },
};

export default function SellScheduleTable({ data }) {
  const [sorting, setSorting] = useState([]);
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const totalSell  = data.reduce((s, r) => s + r.sellAmt, 0);
  const totalTax   = data.reduce((s, r) => s + r.taxEstAmt, 0);
  const totalExit  = data.reduce((s, r) => s + r.exitAmt, 0);
  const totalNet   = data.reduce((s, r) => s + r.netCash, 0);

  const columns = [
    columnHelper.accessor("bestSellDate", {
      header: () => <Text fontSize="11px" color="gray.400">SELL DATE</Text>,
      cell: (i) => <Text fontSize="sm" fontWeight="600" whiteSpace="nowrap">{i.getValue()}</Text>,
    }),
    columnHelper.accessor("settleDate", {
      header: () => <Text fontSize="11px" color="gray.400">SETTLE</Text>,
      cell: (i) => <Text fontSize="sm" color="secondaryGray.600" whiteSpace="nowrap">{i.getValue()}</Text>,
    }),
    columnHelper.accessor("fundName", {
      header: () => <Text fontSize="11px" color="gray.400">FUND</Text>,
      cell: (i) => (
        <Box minW="180px">
          <Text fontSize="sm" fontWeight="600" noOfLines={1}>{i.getValue()}</Text>
          <Text fontSize="10px" color="secondaryGray.500" fontFamily="mono">{i.row.original.isin}</Text>
        </Box>
      ),
    }),
    columnHelper.accessor("whySelling", {
      header: () => <Text fontSize="11px" color="gray.400">RULE</Text>,
      cell: (i) => {
        const meta = RULE_LABELS[i.getValue()] ?? { label: i.getValue(), color: "gray" };
        return <Badge colorScheme={meta.color} fontSize="10px" borderRadius="full">{meta.label}</Badge>;
      },
    }),
    columnHelper.accessor("sellAmt", {
      header: () => <Text fontSize="11px" color="gray.400" textAlign="right">SELL AMT</Text>,
      cell: (i) => <Text fontSize="sm" fontWeight="700" textAlign="right" color="red.500">{fmt(i.getValue())}</Text>,
    }),
    columnHelper.accessor("exitRate", {
      header: () => <Text fontSize="11px" color="gray.400" textAlign="right">EXIT LOAD</Text>,
      cell: (i) => (
        <Text fontSize="sm" textAlign="right" color={i.getValue() > 0 ? "orange.500" : "gray.400"}>
          {i.getValue() > 0 ? `${i.getValue()}% (${fmt(i.row.original.exitAmt)})` : "Nil"}
        </Text>
      ),
    }),
    columnHelper.accessor("taxEstAmt", {
      header: () => <Text fontSize="11px" color="gray.400" textAlign="right">EST. TAX</Text>,
      cell: (i) => (
        <Text fontSize="sm" textAlign="right" color={i.getValue() > 0 ? "orange.400" : "gray.400"}>
          {i.getValue() > 0 ? fmt(i.getValue()) : "Nil"}
        </Text>
      ),
    }),
    columnHelper.accessor("netCash", {
      header: () => <Text fontSize="11px" color="gray.400" textAlign="right">NET CASH</Text>,
      cell: (i) => <Text fontSize="sm" fontWeight="700" textAlign="right" color="green.500">{fmt(i.getValue())}</Text>,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: "scroll", lg: "hidden" }}>
      <Flex px="25px" pt="20px" pb="4px" justify="space-between" align="center">
        <Box>
          <Text color={textColor} fontSize="22px" fontWeight="700">Sell Schedule</Text>
          <Text color="secondaryGray.600" fontSize="sm">Lot-level sell plan · {data.length} lots shown</Text>
        </Box>
        <Text fontSize="xs" color="secondaryGray.400">* Full schedule: 1,329 lots</Text>
      </Flex>

      {/* Summary stats */}
      <SimpleGrid columns={4} gap="12px" px="25px" py="12px" borderBottom="1px solid" borderColor={borderColor}>
        {[
          { label: "Total Sell", value: fmt(totalSell), color: "red.500" },
          { label: "Exit Load",  value: fmt(totalExit),  color: totalExit > 0 ? "orange.500" : "gray.400" },
          { label: "Est. Tax",   value: fmt(totalTax),   color: "orange.400" },
          { label: "Net Cash",   value: fmt(totalNet),   color: "green.500" },
        ].map(({ label, value, color }) => (
          <Stat key={label}>
            <StatLabel fontSize="xs" color="secondaryGray.500">{label}</StatLabel>
            <StatNumber fontSize="md" color={color}>{value}</StatNumber>
          </Stat>
        ))}
      </SimpleGrid>

      <Box overflowX="auto">
        <Table variant="simple" color="gray.500" mt="8px" mb="8px">
          <Thead>
            {table.getHeaderGroups().map((hg) => (
              <Tr key={hg.id}>
                {hg.headers.map((h) => (
                  <Th key={h.id} pe="10px" borderColor={borderColor}
                    cursor={h.column.getCanSort() ? "pointer" : "default"}
                    onClick={h.column.getToggleSortingHandler()}>
                    <Flex align="center">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted()] ?? null}
                    </Flex>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Td key={cell.id} borderColor="transparent" py="10px" fontSize="sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Card>
  );
}
