import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useMemo } from "react";
import Chart from "react-apexcharts";

export default function DriftOverviewCard({ users = [] }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const dataLabelColor = useColorModeValue("#334155", "#E2E8F0");
  const tooltipTheme = useColorModeValue("light", "dark");

  // Top 5 users by drift, descending
  const top5 = useMemo(() => {
    return [...users]
      .sort((a, b) => b.drift - a.drift)
      .slice(0, 5);
  }, [users]);

  const categories = useMemo(() => top5.map((u) => u.name), [top5]);
  const driftValues = useMemo(() => top5.map((u) => parseFloat(u.drift.toFixed(2))), [top5]);

  const options = useMemo(() => ({
    chart: {
      type: "bar",
      toolbar: { show: false },
      animations: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: { position: "top" },
        barHeight: "55%",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(2)}%`,
      offsetX: 28,
      style: { fontSize: "11px", colors: [dataLabelColor] },
    },
    xaxis: {
      categories,
      labels: {
        formatter: (val) => `${val}%`,
        style: { colors: "#A3AED0", fontSize: "11px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#A3AED0", fontSize: "12px" },
        maxWidth: 140,
      },
    },
    grid: {
      borderColor: "rgba(163, 174, 208, 0.2)",
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    colors: ["#FF5252"],
    legend: { show: false },
    tooltip: {
      theme: tooltipTheme,
      y: { formatter: (val) => `${val.toFixed(2)}%` },
    },
  }), [categories, dataLabelColor, tooltipTheme]);

  const series = useMemo(() => [
    { name: "Drift %", data: driftValues },
  ], [driftValues]);

  return (
    <Card p="20px" w="100%" h="100%">
      <Flex justifyContent="space-between" alignItems="center" mb="16px">
        <Box>
          <Text color={textColor} fontSize="lg" fontWeight="700">
            Top 5 Users by Drift
          </Text>
          <Text color="secondaryGray.600" fontSize="sm">
            Highest portfolio drift requiring immediate review
          </Text>
        </Box>
      </Flex>
      <Chart options={options} series={series} type="bar" width="100%" height={260} />
    </Card>
  );
}
