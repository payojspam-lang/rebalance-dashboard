import React from "react";
import { SimpleGrid, Box, Icon, Text, useColorModeValue, Badge, Skeleton, Flex } from "@chakra-ui/react";
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import {
  MdPeople, MdPersonAdd, MdPersonOff, MdAccountBalance,
  MdTrendingUp, MdAnalytics, MdRateReview, MdSchedule,
  MdWarning, MdSwapHoriz, MdOutlinePendingActions,
  MdNotificationsActive, MdMoneyOff, MdTimer
} from "react-icons/md";

function formatAUM(v) {
  if (v == null) return "₹0";
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

export default function ComplexMetricsCards({ loading, data }) {
  const brandColor  = useColorModeValue("brand.500", "brand.400");
  const boxBg       = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const textColor   = useColorModeValue("secondaryGray.900", "white");

  // Safeguard destructured data mapping from API format
  const userStats = data?.user_metrics || {};
  const reviewStats = data?.review_metrics || {};
  const aumStats = data?.aum_metrics || {};
  const actionStats = data?.action_metrics || {};

  return (
    <Box>
      {/* ── ROW 1: PRIMARY KPI CARDS ─────────────────────── */}
      <Skeleton isLoaded={!loading}>
        <CategoryTitle>Primary Growth metrics</CategoryTitle>
        <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} gap="20px">
          {/* Card 1 */}
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdPeople} color="blue.400" />} />}
            name="Total Active Users"
            value={
              <Box>
                <Text fontSize="2xl" fontWeight="700" color={textColor}>{userStats.total_active_users}</Text>
                <Text fontSize="xs" color="green.500">↑ {userStats.net_user_growth_pct}% this month</Text>
              </Box>
            }
          />
          {/* Card 2 */}
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdPersonAdd} color="green.400" />} />}
            name="New Users (MTD)"
            value={
              <Box>
                <Text fontSize="2xl" fontWeight="700" color={textColor}>{userStats.new_users_mtd}</Text>
                <Text fontSize="xs" color="green.500">↑ {userStats.net_user_growth_mtd} net</Text>
              </Box>
            }
          />
          {/* Card 3 */}
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdAccountBalance} color={brandColor} />} />}
            name="Total AUM"
            value={
              <Box>
                <Text fontSize="2xl" fontWeight="700" color={textColor}>{formatAUM(aumStats.total_aum)}</Text>
                <Text fontSize="xs" color="green.500">↑ {aumStats.aum_growth_pct_30d}% (30d)</Text>
              </Box>
            }
          />
          {/* Card 4 */}
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdTrendingUp} color="green.500" />} />}
            name="AUM Added (30d)"
            value={<Text fontSize="2xl" fontWeight="700" color={textColor}>+{formatAUM(aumStats.aum_added_last_30_days)}</Text>}
          />
          {/* Card 5 */}
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdAnalytics} color="purple.400" />} />}
            name="Avg AUM/User"
            value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{formatAUM(aumStats.avg_aum_per_user)}</Text>}
          />
        </SimpleGrid>
      </Skeleton>

      {/* ── ROW 2: REVIEW & WORKFLOW STATUS ────────────────── */}
      <Skeleton isLoaded={!loading}>
        <CategoryTitle>Review & Workflow Status</CategoryTitle>
        <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} gap="20px">
          <MiniStatistics
            startContent={<Badge colorScheme="orange" p="3" borderRadius="md"><Icon as={MdRateReview} w="20px" h="20px" /></Badge>}
            name="New User Reviews Pending"
            value={<Text fontSize="xl" fontWeight="700" color={textColor}>{reviewStats.new_user_reviews_pending}</Text>}
          />
          <MiniStatistics
            startContent={<Badge colorScheme="yellow" p="3" borderRadius="md"><Icon as={MdSchedule} w="20px" h="20px" /></Badge>}
            name="Monthly Reviews Pending"
            value={<Text fontSize="xl" fontWeight="700" color={textColor}>{reviewStats.monthly_reviews_pending}</Text>}
          />
          <MiniStatistics
            startContent={<Badge colorScheme="red" p="3" borderRadius="md"><Icon as={MdWarning} w="20px" h="20px" /></Badge>}
            name="New User Spillover"
            value={<Text fontSize="xl" fontWeight="700" color={textColor}>{reviewStats.new_user_review_spillover}</Text>}
          />
          <MiniStatistics
            startContent={<Badge colorScheme="red" p="3" borderRadius="md"><Icon as={MdWarning} w="20px" h="20px" /></Badge>}
            name="Monthly Spillover"
            value={<Text fontSize="xl" fontWeight="700" color={textColor}>{reviewStats.monthly_review_spillover}</Text>}
          />
          <MiniStatistics
            startContent={<Badge colorScheme="green" p="3" borderRadius="md"><Icon as={MdTimer} w="20px" h="20px" /></Badge>}
            name="Avg Review TAT"
            value={<Text fontSize="xl" fontWeight="700" color={textColor}>{reviewStats.avg_review_turnaround_days} days</Text>}
          />
        </SimpleGrid>
      </Skeleton>

      {/* ── ROW 3: ACTION ALERTS ROW ───────────────────────── */}
      <Skeleton isLoaded={!loading}>
        <CategoryTitle>Priority Action Alerts</CategoryTitle>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px">
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg="orange.100" icon={<Icon w="28px" h="28px" as={MdSwapHoriz} color="orange.500" />} />}
            name="Users Requiring Rebalance"
            value={<Text fontSize="2xl" fontWeight="800" color="orange.500">{actionStats.users_requiring_rebalance}</Text>}
          />
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg="blue.100" icon={<Icon w="28px" h="28px" as={MdOutlinePendingActions} color="blue.500" />} />}
            name="Users with Pending Trades"
            value={<Text fontSize="2xl" fontWeight="800" color="blue.500">{actionStats.users_with_pending_trades}</Text>}
          />
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg="red.100" icon={<Icon w="28px" h="28px" as={MdNotificationsActive} color="red.500" />} />}
            name="Users with Action Alerts"
            value={<Text fontSize="2xl" fontWeight="800" color="red.500">{actionStats.users_with_action_alerts}</Text>}
          />
          <MiniStatistics
            startContent={<IconBox w="56px" h="56px" bg="purple.100" icon={<Icon w="28px" h="28px" as={MdMoneyOff} color="purple.500" />} />}
            name="Unsettled Cash"
            value={<Text fontSize="2xl" fontWeight="800" color="purple.500">{formatAUM(actionStats.total_unsettled_cash)}</Text>}
          />
        </SimpleGrid>
      </Skeleton>
    </Box>
  );
}
