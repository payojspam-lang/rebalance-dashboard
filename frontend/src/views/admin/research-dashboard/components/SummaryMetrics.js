import { SimpleGrid, Box, Icon, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import React, { useMemo } from "react";
import {
  MdPersonAdd, MdCheckCircle, MdWarning,
  MdCalendarToday, MdDoneAll, MdSchedule, MdAccountBalance, MdTrendingUp,
} from "react-icons/md";

function formatAUM(v) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function SummaryMetrics({ metrics }) {
  const brandColor  = useColorModeValue("brand.500", "white");
  const boxBg       = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const textColor   = useColorModeValue("secondaryGray.900", "white");

  const driftColor = useMemo(
    () => metrics.portfolio.avgDrift > 7 ? "red.500" : metrics.portfolio.avgDrift > 4 ? "orange.400" : "green.500",
    [metrics.portfolio.avgDrift]
  );

  return (
    <Box>
      {/* ── Row 1: New client reviews ─────────────────────── */}
      <Text color={textColor} fontSize="sm" fontWeight="700" mb="10px" textTransform="uppercase" letterSpacing="wider">
        New Client Reviews
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="20px" mb="24px">
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdPersonAdd} color="orange.400" />} />
          }
          name="Pending Review"
          value={metrics.newUsers.reviewPending}
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdCheckCircle} color="green.400" />} />
          }
          name="Review Done"
          value={metrics.newUsers.reviewDone}
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdWarning}
                color={metrics.portfolio.criticalAlerts > 0 ? "red.500" : brandColor} />} />
          }
          name="Critical Alerts"
          value={
            <Text fontSize="2xl" fontWeight="700"
              color={metrics.portfolio.criticalAlerts > 0 ? "red.500" : "green.500"}>
              {metrics.portfolio.criticalAlerts}
            </Text>
          }
        />
      </SimpleGrid>

      {/* ── Row 2: Monthly reviews ────────────────────────── */}
      <Text color={textColor} fontSize="sm" fontWeight="700" mb="10px" textTransform="uppercase" letterSpacing="wider">
        Monthly Reviews — Today
      </Text>
      <SimpleGrid columns={{ base: 2, md: 5 }} gap="20px">
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdCalendarToday} color="blue.400" />} />
          }
          name="Pending Today"
          value={
            <Text fontSize="2xl" fontWeight="700"
              color={metrics.monthlyReview.pendingToday > 0 ? "blue.500" : "gray.400"}>
              {metrics.monthlyReview.pendingToday}
            </Text>
          }
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdDoneAll} color="green.400" />} />
          }
          name="Completed Today"
          value={metrics.monthlyReview.doneToday}
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdSchedule}
                color={metrics.monthlyReview.spillover > 0 ? "orange.400" : brandColor} />} />
          }
          name="Spillover"
          value={
            <Text fontSize="2xl" fontWeight="700"
              color={metrics.monthlyReview.spillover > 0 ? "orange.500" : "gray.400"}>
              {metrics.monthlyReview.spillover}
            </Text>
          }
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdAccountBalance} color={brandColor} />} />
          }
          name="AUM Under Review"
          value={formatAUM(metrics.portfolio.totalAumUnderReview)}
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdTrendingUp} color={driftColor} />} />
          }
          name="Avg Portfolio Drift"
          value={
            <Text fontSize="2xl" fontWeight="700" color={driftColor}>
              {metrics.portfolio.avgDrift.toFixed(2)}%
            </Text>
          }
        />
      </SimpleGrid>
    </Box>
  );
}
