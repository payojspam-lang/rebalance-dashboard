import {
  Box, Tabs, TabList, Tab, TabPanels, TabPanel,
  Table, Thead, Tbody, Tr, Th, Td, Badge, Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import Card from "components/card/Card";
import { formatINR } from "./utils";

const TYPE_COLOR  = { 
  BUY: "green", SELL: "red", SWITCH: "blue",
  "INITIAL FUNDING": "teal", "TOP UP": "cyan", SIP: "purple", SWP: "pink", REDEMPTION: "orange" 
};
const STATUS_COLOR = { EXECUTED: "green", PENDING: "yellow", FAILED: "red", CANCELLED: "gray" };

function TransactionTable({ rows }) {
  const textColor   = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");

  if (!rows || rows.length === 0) {
    return <Text p="20px" color="secondaryGray.500" fontSize="sm">No transactions found.</Text>;
  }

  return (
    <Box overflowX="auto">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            {["DATE", "TYPE", "FUND", "AMOUNT", "STATUS", "INITIATED BY", "REFERENCE"].map((h) => (
              <Th key={h} fontSize="10px" color="gray.400" borderColor={borderColor}>{h}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.id}>
              <Td fontSize="sm" borderColor={borderColor} whiteSpace="nowrap">{row.date}</Td>
              <Td borderColor={borderColor}>
                <Badge colorScheme={TYPE_COLOR[row.type] ?? "gray"} borderRadius="full" fontSize="10px">
                  {row.type}
                </Badge>
              </Td>
              <Td borderColor={borderColor} maxW="200px">
                <Text fontSize="sm" noOfLines={1} color={textColor}>{row.fundName}</Text>
                <Text fontSize="9px" fontFamily="mono" color="secondaryGray.400">{row.isin}</Text>
              </Td>
              <Td fontSize="sm" fontWeight="600" isNumeric borderColor={borderColor}
                color={["SELL", "SWP", "REDEMPTION"].includes(row.type) ? "red.500" : "green.500"}>
                {formatINR(row.amount)}
              </Td>
              <Td borderColor={borderColor}>
                <Badge colorScheme={STATUS_COLOR[row.status] ?? "gray"} borderRadius="full" fontSize="10px">
                  {row.status}
                </Badge>
              </Td>
              <Td fontSize="sm" color="secondaryGray.600" borderColor={borderColor}>{row.initiatedBy}</Td>
              <Td fontSize="10px" fontFamily="mono" color="secondaryGray.400" borderColor={borderColor}>
                {row.reference}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default function TransactionHistoryTabs({ data }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const fmCount  = data?.fundManagerInitiated?.length ?? 0;
  const clCount  = data?.clientInitiated?.length ?? 0;

  return (
    <Card p="20px">
      <Text color={textColor} fontSize="lg" fontWeight="700" mb="12px">
        Transaction History
      </Text>
      <Tabs variant="line" colorScheme="brand" isLazy>
        <TabList mb="0">
          <Tab fontSize="sm">Fund Manager Initiated ({fmCount})</Tab>
          <Tab fontSize="sm">Client Initiated ({clCount})</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px="0" pt="12px">
            <TransactionTable rows={data?.fundManagerInitiated} />
          </TabPanel>
          <TabPanel px="0" pt="12px">
            <TransactionTable rows={data?.clientInitiated} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Card>
  );
}
