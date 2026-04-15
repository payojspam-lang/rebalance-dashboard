import {
  Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React from "react";
import StatusBadge from "views/admin/research-dashboard/components/StatusBadge";
import { mockAuditLog } from "./variables/mockData";

const ACTION_COLOR = {
  STATUS_CHANGE: "blue",
  MODIFY:        "orange",
  RECALCULATE:   "purple",
  BSE_EXPORT:    "green",
};

function ActionBadge({ action }) {
  const label = action.replace(/_/g, " ");
  return (
    <Badge
      colorScheme={ACTION_COLOR[action] ?? "gray"}
      borderRadius="full"
      px="2"
      fontSize="xs"
    >
      {label}
    </Badge>
  );
}

function formatTs(ts) {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date}, ${time}`;
}

export default function AuditLog() {
  const textColor   = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const subColor    = useColorModeValue("gray.500", "gray.400");
  const rowHoverBg  = useColorModeValue("gray.50", "whiteAlpha.50");
  const headerBg    = useColorModeValue("gray.50", "navy.800");

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Box mb="24px">
        <Text color={textColor} fontSize="2xl" fontWeight="700">Audit Log</Text>
        <Text color={subColor} fontSize="sm">
          Full history of recommendation state changes and system events.
        </Text>
      </Box>

      <Card px="0px" overflowX="auto">
        <Flex px="20px" pt="16px" pb="12px" align="center" justify="space-between">
          <Text fontWeight="700" color={textColor} fontSize="md">
            Activity History
          </Text>
          <Text fontSize="sm" color={subColor}>
            {mockAuditLog.length} entries
          </Text>
        </Flex>

        <Table variant="simple" size="sm">
          <Thead bg={headerBg}>
            <Tr>
              <Th
                color={subColor}
                borderColor={borderColor}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
                py="12px"
                px="20px"
                whiteSpace="nowrap"
              >
                Timestamp
              </Th>
              <Th
                color={subColor}
                borderColor={borderColor}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                User
              </Th>
              <Th
                color={subColor}
                borderColor={borderColor}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Action
              </Th>
              <Th
                color={subColor}
                borderColor={borderColor}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
                maxW="260px"
              >
                Resource
              </Th>
              <Th
                color={subColor}
                borderColor={borderColor}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                From Status
              </Th>
              <Th
                color={subColor}
                borderColor={borderColor}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                To Status
              </Th>
              <Th
                color={subColor}
                borderColor={borderColor}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Rationale
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {mockAuditLog.map((entry) => (
              <Tr
                key={entry.id}
                _hover={{ bg: rowHoverBg }}
                transition="background 0.1s"
              >
                <Td
                  px="20px"
                  py="12px"
                  borderColor={borderColor}
                  whiteSpace="nowrap"
                  fontSize="xs"
                  color={subColor}
                  fontFamily="mono"
                >
                  {formatTs(entry.timestamp)}
                </Td>
                <Td borderColor={borderColor} py="12px" fontSize="sm" color={textColor} whiteSpace="nowrap">
                  {entry.user}
                </Td>
                <Td borderColor={borderColor} py="12px">
                  <ActionBadge action={entry.action} />
                </Td>
                <Td
                  borderColor={borderColor}
                  py="12px"
                  fontSize="sm"
                  color={textColor}
                  maxW="260px"
                >
                  <Text noOfLines={2} title={entry.resource}>
                    {entry.resource}
                  </Text>
                </Td>
                <Td borderColor={borderColor} py="12px">
                  <StatusBadge status={entry.fromStatus} />
                </Td>
                <Td borderColor={borderColor} py="12px">
                  <StatusBadge status={entry.toStatus} />
                </Td>
                <Td
                  borderColor={borderColor}
                  py="12px"
                  fontSize="sm"
                  color={subColor}
                  maxW="320px"
                >
                  <Text noOfLines={2} title={entry.rationale}>
                    {entry.rationale}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </Box>
  );
}
