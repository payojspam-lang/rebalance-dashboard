import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useMemo } from "react";
import Chart from "react-apexcharts";

export default function AllocationChart({ allocation = [], standalone = true }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");

  // Memoize so ApexCharts never sees new object references unless allocation data changes
  const categories = useMemo(() => allocation.map((d) => d.category), [allocation]);

  const series = useMemo(() => [
    { name: "Current %", data: allocation.map((d) => d.current) },
    { name: "Target %",  data: allocation.map((d) => d.target)  },
  ], [allocation]);

  const options = useMemo(() => ({
    chart: {
      type: "bar",
      toolbar: { show: false },
      animations: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        dataLabels: { position: "top" },
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
      offsetY: -18,
      style: { fontSize: "10px", colors: ["#334155"] },
    },
    stroke: { show: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: "#A3AED0", fontSize: "11px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      max: 70,
      labels: {
        formatter: (val) => `${val}%`,
        style: { colors: "#A3AED0", fontSize: "11px" },
      },
    },
    grid: {
      borderColor: "rgba(163, 174, 208, 0.2)",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    colors: ["#4318FF", "#6AD2FF"],
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      labels: { colors: "#334155" },
      markers: { radius: 12 },
    },
    tooltip: {
      theme: "light",
      y: { formatter: (val) => `${val.toFixed(2)}%` },
    },
  }), [categories]);

  const chartEl = (
    <Chart options={options} series={series} type="bar" width="100%" height={260} />
  );

  if (!standalone) return chartEl;

  return (
    <Card p="20px" w="100%" h="100%">
      <Flex justifyContent="space-between" alignItems="center" mb="16px">
        <Box>
          <Text color={textColor} fontSize="lg" fontWeight="700">
            Allocation vs. Mandate
          </Text>
          <Text color="secondaryGray.600" fontSize="sm">
            Current vs. Target by Asset Class
          </Text>
        </Box>
      </Flex>
      {chartEl}
    </Card>
  );
}
