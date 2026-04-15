import { Box } from "@chakra-ui/react";
import React from "react";
import useDashboardKPIs from "hooks/useDashboardKPIs";
import HeroKPIRow from "./components/HeroKPIRow";
import DashboardCharts from "./components/DashboardCharts";

export default function ResearchDashboard() {
  const { data, loading, error } = useDashboardKPIs();

  if (error) console.error("Dashboard API Error:", error);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <HeroKPIRow loading={loading} data={data} />
      <DashboardCharts loading={loading} data={data} />
    </Box>
  );
}
