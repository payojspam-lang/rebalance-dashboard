import { Box, Flex, Text, Badge, Divider, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue } from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useMemo } from "react";

export default function InvestmentMandateCard({ mandateDetail, allocation }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");
  const subColor = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const noteBg = useColorModeValue("orange.50", "whiteAlpha.50");

  const rows = useMemo(() => {
    return allocation.map((alloc) => {
      const mandate = mandateDetail.targetAllocation.find(
        (m) => m.assetClass === alloc.category
      );
      const deviation = parseFloat((alloc.current - alloc.target).toFixed(2));
      let statusLabel, statusColor;
      if (Math.abs(deviation) < 1)      { statusLabel = "On Track";    statusColor = "green";  }
      else if (Math.abs(deviation) < 3) { statusLabel = "Minor Drift"; statusColor = "yellow"; }
      else                              { statusLabel = "Out of Band"; statusColor = "red";    }
      return {
        assetClass: alloc.category,
        min:        mandate?.min    ?? "—",
        current:    alloc.current,
        target:     alloc.target,
        max:        mandate?.max    ?? "—",
        deviation,
        statusLabel,
        statusColor,
      };
    });
  }, [allocation, mandateDetail]);

  return (
    <Card p="20px" mb="20px">
      <Box mb="12px">
        <Text color={textColor} fontSize="lg" fontWeight="700" mb="6px">
          Investment Mandate
        </Text>
        <Flex align="center" gap="8px" flexWrap="wrap">
          <Badge colorScheme="purple" borderRadius="full" px="3" py="1" fontSize="sm">
            {mandateDetail.riskMandate}
          </Badge>
          <Text fontSize="sm" color={subColor} lineHeight="1.4">
            {mandateDetail.description}
          </Text>
        </Flex>
      </Box>

      <Box overflowX="auto" mb="16px">
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th color={subColor} fontSize="10px" borderColor={borderColor}>Asset Class</Th>
              <Th color={subColor} fontSize="10px" isNumeric borderColor={borderColor}>Min%</Th>
              <Th color={subColor} fontSize="10px" isNumeric borderColor={borderColor}>Current%</Th>
              <Th color={subColor} fontSize="10px" isNumeric borderColor={borderColor}>Max%</Th>
              <Th color={subColor} fontSize="10px" isNumeric borderColor={borderColor}>Target%</Th>
              <Th color={subColor} fontSize="10px" borderColor={borderColor}>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((r) => (
              <Tr key={r.assetClass}>
                <Td fontSize="sm" borderColor={borderColor}>{r.assetClass}</Td>
                <Td fontSize="sm" isNumeric color={subColor} borderColor={borderColor}>{r.min}%</Td>
                <Td fontSize="sm" isNumeric fontWeight="600" borderColor={borderColor}>{r.current.toFixed(2)}%</Td>
                <Td fontSize="sm" isNumeric color={subColor} borderColor={borderColor}>{r.max}%</Td>
                <Td fontSize="sm" isNumeric borderColor={borderColor}>{r.target.toFixed(2)}%</Td>
                <Td borderColor={borderColor}>
                  <Badge colorScheme={r.statusColor} borderRadius="full" fontSize="9px">
                    {r.statusLabel}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {mandateDetail.specialInstructions && (
        <>
          <Divider mb="14px" />
          <Box>
            <Text fontSize="xs" fontWeight="700" color={subColor} mb="8px" textTransform="uppercase" letterSpacing="wider">
              Special Instructions
            </Text>
            <Box bg={noteBg} borderLeft="3px solid" borderColor="orange.300" borderRadius="md" p="12px">
              <Text fontSize="sm" color={textColor} lineHeight="1.7">
                {mandateDetail.specialInstructions}
              </Text>
            </Box>
          </Box>
        </>
      )}
    </Card>
  );
}
