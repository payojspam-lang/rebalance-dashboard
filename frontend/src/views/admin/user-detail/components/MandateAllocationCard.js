import {
  Box, Text, Divider, useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React from "react";
import AllocationChart from "views/admin/research-dashboard/components/AllocationChart";

export default function MandateAllocationCard({ mandateDetail, allocation }) {
  const textColor   = useColorModeValue("secondaryGray.900", "white");
  const subColor    = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");
  const noteBg      = useColorModeValue("orange.50", "whiteAlpha.50");

  return (
    <Card p="20px" mb="20px">
      {/* ── Header ── */}
      <Box mb="16px">
        <Text color={textColor} fontSize="lg" fontWeight="700" mb="6px">
          Allocation vs. Mandate
        </Text>
        <Text fontSize="sm" color={subColor}>Current vs. Target by Asset Class</Text>
      </Box>

      <Divider mb="16px" />

      {/* Chart — title already in header above */}
      <Box w="100%">
        <AllocationChart allocation={allocation} standalone={false} />
      </Box>

    </Card>
  );
}
