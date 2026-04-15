import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import useDashboardKPIs from "hooks/useDashboardKPIs";
import ComplexMetricsCards from "./components/ComplexMetricsCards";
import DashboardCharts from "./components/DashboardCharts";

export default function ResearchDashboard() {
  const { data, loading, error } = useDashboardKPIs();
  const textColor = useColorModeValue("secondaryGray.900", "white");

  if (error) {
    console.error("Dashboard API Error:", error);
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Text fontSize="2xl" fontWeight="700" color={textColor} mb="20px">Rebalance Engine / Dashboard</Text>
      
      {/* Renders Row 1 (Primary), Row 2 (WorkflowStatus), Row 3 (ActionAlerts) */}
      <ComplexMetricsCards loading={loading} data={data} />
      
      {/* Renders Row 4 (Line/Bar Charts), Row 5 (Risk Mandate Donut) */}
      <DashboardCharts loading={loading} data={data} />

    </Box>
  );
}
