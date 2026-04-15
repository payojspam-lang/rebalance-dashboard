import { SimpleGrid, Box, Icon, Text, useColorModeValue, Divider } from "@chakra-ui/react";
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import React from "react";
import {
  MdAccountBalance, MdTrendingUp, MdPeople, MdPersonAdd, MdPersonOff,
  MdRateReview, MdSchedule, MdWarning, MdSwapHoriz, MdOutlinePendingActions,
  MdNotificationsActive, MdAlarmOff
} from "react-icons/md";

function formatAUM(v) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

const CategoryTitle = ({ children }) => {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  return (
    <Text color={textColor} fontSize="sm" fontWeight="700" mb="12px" mt="28px" textTransform="uppercase" letterSpacing="wider">
      {children}
    </Text>
  );
};

export default function SummaryMetrics({ metrics }) {
  const brandColor  = useColorModeValue("brand.500", "brand.400");
  const boxBg       = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const textColor   = useColorModeValue("secondaryGray.900", "white");

  return (
    <Box>
      {/* ── Asset Under Management ────────────────────────────── */}
      <CategoryTitle>Asset Under Management</CategoryTitle>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px">
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdAccountBalance} color={brandColor} />} />}
          name="Total AUM"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{formatAUM(metrics.totalAum)}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdTrendingUp} color="green.500" />} />}
          name="AUM Added (Last 30 Days)"
          value={<Text fontSize="2xl" fontWeight="700" color="green.500">+{formatAUM(metrics.aumAdded30Days)}</Text>}
        />
      </SimpleGrid>

      {/* ── Core User Count Metrics ───────────────────────────── */}
      <CategoryTitle>Core User Count Metrics</CategoryTitle>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="20px">
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdPeople} color="blue.400" />} />}
          name="Total Active Users"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.totalActiveUsers}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdPersonAdd} color="green.400" />} />}
          name="New Users Added (MTD)"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.newUsersAddedMTD}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdPersonOff} color="red.400" />} />}
          name="Churned Users"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.churnedUsers}</Text>}
        />
      </SimpleGrid>

      {/* ── Review & Workflow Count Metrics ───────────────────── */}
      <CategoryTitle>Review & Workflow Count Metrics</CategoryTitle>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px">
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdRateReview} color="brand.500" />} />}
          name="New User Reviews Pending"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.newUsersPendingReview}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdSchedule} color="orange.400" />} />}
          name="Monthly Reviews Pending"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.monthlyReviewsPending}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdAlarmOff} color="red.500" />} />}
          name="New User Spillovers"
          value={<Text fontSize="2xl" fontWeight="700" color={metrics.newUsersReviewSpillover > 0 ? "red.500" : textColor}>{metrics.newUsersReviewSpillover}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdWarning} color="red.500" />} />}
          name="Monthly Review Spillovers"
          value={<Text fontSize="2xl" fontWeight="700" color={metrics.monthlyReviewSpillover > 0 ? "red.500" : textColor}>{metrics.monthlyReviewSpillover}</Text>}
        />
      </SimpleGrid>

      {/* ── Action-Oriented User Count Metrics ────────────────── */}
      <CategoryTitle>Action-Oriented Alerts</CategoryTitle>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="20px" pb="20px">
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdSwapHoriz} color="red.400" />} />}
          name="Users Requiring Rebalance"
          value={<Text fontSize="2xl" fontWeight="700" color={metrics.usersRequiringRebalance > 0 ? "red.400" : textColor}>{metrics.usersRequiringRebalance}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdOutlinePendingActions} color="orange.400" />} />}
          name="Users with Pending Trades"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.usersWithPendingTrades}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdNotificationsActive} color="red.500" />} />}
          name="Users with Action Alert"
          value={<Text fontSize="2xl" fontWeight="700" color={metrics.usersWithActionAlert > 0 ? "red.500" : textColor}>{metrics.usersWithActionAlert}</Text>}
        />
      </SimpleGrid>
    </Box>
  );
}
