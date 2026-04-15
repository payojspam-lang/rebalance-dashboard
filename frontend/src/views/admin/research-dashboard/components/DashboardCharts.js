import React from "react";
import { SimpleGrid, Box, Text, useColorModeValue, Skeleton } from "@chakra-ui/react";
import ReactApexChart from "react-apexcharts";
import Card from "components/card/Card";

export default function DashboardCharts({ loading, data }) {
  const textColor  = useColorModeValue("secondaryGray.900", "white");
  // Fix: tooltip theme adapts to color mode — was hardcoded "light"
  const chartTheme = useColorModeValue("light", "dark");
  const aumTrend = data?.trend_data?.aum_last_12_months || [];
  const mandateDist = data?.mandate_distribution || {
    conservative: 0,
    low: 0,
    moderate: 0,
    high: 0,
    aggressive: 0,
  };

  // --- AUM Trend Chart (Line) ---
  const aumChartData = [{ name: "AUM", data: aumTrend.map((d) => d.aum / 10000000) }];
  const aumChartOptions = {
    chart: { type: "line", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: aumTrend.map((d) => d.month),
      labels: { style: { colors: "#A3AED0" } },
    },
    yaxis: {
      labels: {
        formatter: (val) => `₹${val.toFixed(1)}Cr`,
        style: { colors: "#A3AED0" },
      },
    },
    colors: ["#4318FF"],
    dataLabels: { enabled: false },
    grid: { show: false },
    tooltip: { theme: chartTheme },
  };

  // --- Mandate Distribution (Donut) ---
  const mandateChartData = [
    mandateDist.conservative,
    mandateDist.low,
    mandateDist.moderate,
    mandateDist.high,
    mandateDist.aggressive,
  ];
  const mandateChartOptions = {
    chart: { type: "donut" },
    labels: ["Conservative", "Low", "Moderate", "High", "Aggressive"],
    colors: ["#4318FF", "#39B8FF", "#05CD99", "#FFB547", "#EE5D50"],
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%" } } },
    legend: { position: "bottom", labels: { colors: "#A3AED0" } },
    stroke: { show: false },
    tooltip: { theme: chartTheme },
  };

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px" mb="20px">
      {/* AUM Trend (Line) */}
      <Skeleton isLoaded={!loading} borderRadius="20px">
        <Card p="20px" h="100%">
          <Text fontSize="lg" color={textColor} fontWeight="bold" mb="10px">
            AUM Growth (Last 12 Months)
          </Text>
          <Box h="300px">
            <ReactApexChart
              options={aumChartOptions}
              series={aumChartData}
              type="line"
              width="100%"
              height="100%"
            />
          </Box>
        </Card>
      </Skeleton>

      {/* Users by Risk Mandate (Donut) */}
      <Skeleton isLoaded={!loading} borderRadius="20px">
        <Card p="20px" h="100%">
          <Text fontSize="lg" color={textColor} fontWeight="bold" mb="10px">
            Users by Risk Mandate
          </Text>
          <Box h="300px">
            <ReactApexChart
              options={mandateChartOptions}
              series={mandateChartData}
              type="donut"
              width="100%"
              height="100%"
            />
          </Box>
        </Card>
      </Skeleton>
    </SimpleGrid>
  );
}
