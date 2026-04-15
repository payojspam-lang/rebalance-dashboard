import React from "react";
import { SimpleGrid, Box, Flex, Text, useColorModeValue, Skeleton } from "@chakra-ui/react";
import ReactApexChart from "react-apexcharts";
import Card from "components/card/Card";

const CategoryTitle = ({ children }) => {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  return (
    <Text color={textColor} fontSize="sm" fontWeight="700" mb="12px" mt="28px" textTransform="uppercase" letterSpacing="wider">
      {children}
    </Text>
  );
};

export default function DashboardCharts({ loading, data }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const aumTrend = data?.trend_data?.aum_last_12_months || [];
  const userGrowth = data?.trend_data?.user_growth_last_6_months || [];
  const mandateDist = data?.mandate_distribution || { conservative: 0, low: 0, moderate: 0, high: 0, aggressive: 0 };

  // --- AUM Trend Chart (Line) ---
  const aumChartData = [{ name: "AUM", data: aumTrend.map(d => d.aum / 10000000) }]; // Display in Crs
  const aumChartOptions = {
    chart: { type: "line", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 3 },
    xaxis: { categories: aumTrend.map(d => d.month), labels: { style: { colors: "#A3AED0" } } },
    yaxis: { labels: { formatter: val => `₹${val.toFixed(1)}Cr`, style: { colors: "#A3AED0" } } },
    colors: ["#4318FF"],
    dataLabels: { enabled: false },
    grid: { show: false },
  };

  // --- User Growth (Bar) ---
  const userGrowthChartData = [
    { name: "New Users", data: userGrowth.map(d => d.new) }
  ];
  const userGrowthChartOptions = {
    chart: { type: "bar", stacked: false, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
    xaxis: { categories: userGrowth.map(d => d.month), labels: { style: { colors: "#A3AED0" } } },
    yaxis: { labels: { style: { colors: "#A3AED0" } } },
    colors: ["#05CD99"],
    dataLabels: { enabled: false },
    grid: { show: false },
    legend: { position: "top" }
  };

  // --- Mandate Distribution (Donut) ---
  const mandateChartData = [
    mandateDist.conservative, mandateDist.low, mandateDist.moderate,
    mandateDist.high, mandateDist.aggressive
  ];
  const mandateChartOptions = {
    chart: { type: "donut" },
    labels: ["Conservative", "Low", "Moderate", "High", "Aggressive"],
    colors: ["#4318FF", "#39B8FF", "#05CD99", "#FFB547", "#EE5D50"],
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%" } } },
    legend: { position: "bottom" },
    stroke: { show: false }
  };

  return (
    <Box pb="40px">
      {/* ── ROW 4: LINE AND BAR CHARTS ───────────────────────── */}
      <CategoryTitle>Growth Trajectories</CategoryTitle>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
        <Skeleton isLoaded={!loading} borderRadius="20px">
          <Card p="20px">
            <Text fontSize="lg" color={textColor} fontWeight="bold" mb="10px">AUM Growth (Last 12 Months)</Text>
            <Box h="300px">
              <ReactApexChart options={aumChartOptions} series={aumChartData} type="line" width="100%" height="100%" />
            </Box>
          </Card>
        </Skeleton>

        <Skeleton isLoaded={!loading} borderRadius="20px">
          <Card p="20px">
            <Text fontSize="lg" color={textColor} fontWeight="bold" mb="10px">User Growth</Text>
            <Box h="300px">
              <ReactApexChart options={userGrowthChartOptions} series={userGrowthChartData} type="bar" width="100%" height="100%" />
            </Box>
          </Card>
        </Skeleton>
      </SimpleGrid>

      {/* ── ROW 5: RISK DISTRIBUTION PANEL ─────────────────────── */}
      <CategoryTitle>Client Risk Allocation</CategoryTitle>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
        <Skeleton isLoaded={!loading} borderRadius="20px">
          <Card p="20px">
            <Text fontSize="lg" color={textColor} fontWeight="bold" mb="10px">Users by Risk Mandate</Text>
            <Box h="300px">
              <ReactApexChart options={mandateChartOptions} series={mandateChartData} type="donut" width="100%" height="100%" />
            </Box>
          </Card>
        </Skeleton>
        <Skeleton isLoaded={!loading} borderRadius="20px">
          {/* Reserved space as indicated by design spec "Two Side-by-Side Panels" */}
          <Card p="20px" align="center" justify="center">
            <Text fontSize="md" color="gray.500" fontWeight="500">Additional Segment Analytics<br />Deploying Next Cycle</Text>
          </Card>
        </Skeleton>
      </SimpleGrid>
    </Box>
  );
}
