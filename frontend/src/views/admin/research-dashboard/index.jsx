import { Box, SimpleGrid } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SummaryMetrics from "./components/SummaryMetrics";
import AllocationChart from "./components/AllocationChart";
import DriftOverviewCard from "./components/DriftOverviewCard";
import UserList from "./components/UserList";
import { mockSummaryMetrics, mockAllocation, mockUsers } from "./variables/mockData";

export default function ResearchDashboard() {
  const navigate = useNavigate();

  const handleRowClick = useCallback((user) => {
    navigate(`/admin/rebalance/user/${user.id}`);
  }, [navigate]);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Row 1 — Summary KPIs */}
      <SummaryMetrics metrics={mockSummaryMetrics} />

      {/* Row 2 — Allocation chart + Drift overview */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="20px" mb="20px">
        <AllocationChart allocation={mockAllocation} />
        <DriftOverviewCard users={mockUsers} />
      </SimpleGrid>

      {/* Row 3 — Full user list */}
      <UserList users={mockUsers} onRowClick={handleRowClick} />
    </Box>
  );
}
