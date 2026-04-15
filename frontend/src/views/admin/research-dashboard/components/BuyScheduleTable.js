import {
  Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, useColorModeValue, Stat, StatLabel, StatNumber,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React from "react";
import StarRating from "./StarRating";

function fmt(v) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

const TRANCHE_COLOR = { 1: "blue", 2: "teal", 3: "cyan" };

// Group rows by buyDate to render tranches visually
function groupByDate(rows) {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.buyDate]) map[r.buyDate] = [];
    map[r.buyDate].push(r);
  });
  return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
}

export default function BuyScheduleTable({ data }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const trancheBg  = useColorModeValue("gray.50", "navy.800");

  const totalBuy = data.reduce((s, r) => s + r.buyAmt, 0);
  const tranches = groupByDate(data);

  return (
    <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: "scroll", lg: "hidden" }}>
      <Flex px="25px" pt="20px" pb="4px" justify="space-between" align="center">
        <Box>
          <Text color={textColor} fontSize="22px" fontWeight="700">Buy Schedule</Text>
          <Text color="secondaryGray.600" fontSize="sm">Multi-tranche buy plan · {data.length} orders across {tranches.length} dates</Text>
        </Box>
        <Stat textAlign="right">
          <StatLabel fontSize="xs" color="secondaryGray.500">Total Buy</StatLabel>
          <StatNumber fontSize="md" color="green.500">{fmt(totalBuy)}</StatNumber>
        </Stat>
      </Flex>

      {/* Execution timeline strip */}
      <Flex px="25px" py="12px" gap="0" borderBottom="1px solid" borderColor={borderColor} overflowX="auto">
        {tranches.map(([date, rows], idx) => (
          <Flex key={date} align="center" gap="0">
            <Box textAlign="center" minW="120px">
              <Badge colorScheme={TRANCHE_COLOR[rows[0].tranche]} borderRadius="full" px="2" mb="4px">
                Tranche {rows[0].tranche}
              </Badge>
              <Text fontSize="xs" fontWeight="700" color={textColor}>{date}</Text>
              <Text fontSize="xs" color="secondaryGray.500">{fmt(rows.reduce((s, r) => s + r.buyAmt, 0))}</Text>
            </Box>
            {idx < tranches.length - 1 && (
              <Box flex="1" h="1px" bg="gray.200" mx="4px" minW="30px" />
            )}
          </Flex>
        ))}
      </Flex>

      {/* Tranche tables */}
      <Box overflowX="auto">
        {tranches.map(([date, rows]) => (
          <Box key={date} mb="4px">
            <Flex px="25px" py="8px" bg={trancheBg} align="center" gap="8px" borderBottom="1px solid" borderColor={borderColor}>
              <Badge colorScheme={TRANCHE_COLOR[rows[0].tranche]} borderRadius="full">T{rows[0].tranche}</Badge>
              <Text fontSize="sm" fontWeight="700" color={textColor}>{date}</Text>
              <Text fontSize="xs" color="secondaryGray.500">
                {rows.length} order{rows.length > 1 ? "s" : ""} · {fmt(rows.reduce((s, r) => s + r.buyAmt, 0))} total
              </Text>
            </Flex>
            <Table variant="simple" color="gray.500">
              <Thead>
                <Tr>
                  {["FUND", "ISIN", "RATING", "RULE", "BUY AMT", "% OF CASH"].map((h) => (
                    <Th key={h} pe="10px" borderColor={borderColor}>
                      <Text fontSize="11px" color="gray.400">{h}</Text>
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((row) => (
                  <Tr key={row.id}>
                    <Td borderColor="transparent" py="10px" minW="180px">
                      <Text fontSize="sm" fontWeight="600">{row.fundName}</Text>
                    </Td>
                    <Td borderColor="transparent" py="10px">
                      <Text fontSize="xs" fontFamily="mono" color="secondaryGray.500">{row.isin}</Text>
                    </Td>
                    <Td borderColor="transparent" py="10px">
                      <StarRating rating={row.rating} />
                    </Td>
                    <Td borderColor="transparent" py="10px">
                      <Badge colorScheme="green" fontSize="10px" borderRadius="full">{row.rule}</Badge>
                    </Td>
                    <Td borderColor="transparent" py="10px">
                      <Text fontSize="sm" fontWeight="700" color="green.500">{fmt(row.buyAmt)}</Text>
                    </Td>
                    <Td borderColor="transparent" py="10px">
                      <Text fontSize="sm" fontWeight="600">{row.pctOfCash.toFixed(2)}%</Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
