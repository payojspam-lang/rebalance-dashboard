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
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdPersonAdd} color="orange.400" />} />}
          name="Clients Pending Review"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.newUsers.reviewPending}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdWarning} color={metrics.portfolio.criticalAlerts > 0 ? "red.500" : brandColor} />} />}
          name="Critical Alerts"
          value={<Text fontSize="2xl" fontWeight="700" color={metrics.portfolio.criticalAlerts > 0 ? "red.500" : "green.500"}>{metrics.portfolio.criticalAlerts}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdAccountBalance} color={brandColor} />} />}
          name="Total AUM Under Review"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{formatAUM(metrics.portfolio.totalAumUnderReview)}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdTrendingUp} color={driftColor} />} />}
          name="Firm Avg Portfolio Drift"
          value={<Text fontSize="2xl" fontWeight="700" color={driftColor}>{metrics.portfolio.avgDrift.toFixed(2)}%</Text>}
        />
      </SimpleGrid>
    </Box>
  );
}
