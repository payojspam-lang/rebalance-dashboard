import { Box } from "@chakra-ui/react";
import React from "react";
import SummaryMetrics from "./components/SummaryMetrics";
import { mockSummaryMetrics } from "./variables/mockData";

export default function ResearchDashboard() {
  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <SummaryMetrics metrics={mockSummaryMetrics} />
    </Box>
  );
}
