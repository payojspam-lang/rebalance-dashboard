import React from "react";
import { SimpleGrid, Icon, Text, useColorModeValue, Skeleton } from "@chakra-ui/react";
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import {
  MdAccountBalance,
  MdPersonAdd,
  MdSwapHoriz,
  MdRateReview,
  MdWarning,
} from "react-icons/md";

function formatAUM(v) {
  if (v == null) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function HeroKPIRow({ loading, data }) {
  const boxBg      = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const textColor  = useColorModeValue("secondaryGray.900", "white");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const alertOranBg = useColorModeValue("orange.100", "orange.800");
  const alertRedBg  = useColorModeValue("red.100", "red.900");

  const aumStats    = data?.aum_metrics    || {};
  const userStats   = data?.user_metrics   || {};
  const actionStats = data?.action_metrics || {};
  const reviewStats = data?.review_metrics || {};

  const totalPendingReviews =
    (reviewStats.new_user_reviews_pending || 0) +
    (reviewStats.monthly_reviews_pending  || 0);

  const totalSpillovers =
    (reviewStats.new_user_review_spillover || 0) +
    (reviewStats.monthly_review_spillover  || 0);

  const rebalanceAlerts = actionStats.users_requiring_rebalance || 0;

  // All 5 cards share the same value renderer so heights stay identical
  const val = (text, color) => (
    <Text fontSize="2xl" fontWeight="700" color={color ?? textColor}>
      {text}
    </Text>
  );

  return (
    <SimpleGrid
      columns={{ base: 2, md: 5 }}
      gap="20px"
      mb="20px"
      // Force all cards to the same height as the tallest in the row.
      // Each grid cell (Skeleton) becomes a flex column so the inner Card fills it.
      sx={{
        alignItems: "stretch",
        "& > *": { display: "flex", flexDirection: "column" },
        "& > * > *": { flex: 1 },          // Card stretches inside Skeleton
        "& > * > * > div": { height: "100%" }, // inner Flex inside Card
      }}
    >

      {/* 1 — Total AUM */}
      <Skeleton isLoaded={!loading} borderRadius="20px">
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdAccountBalance} color={brandColor} />}
            />
          }
          name="Total AUM"
          value={val(formatAUM(aumStats.total_aum))}
        />
      </Skeleton>

      {/* 2 — New Users MTD */}
      <Skeleton isLoaded={!loading} borderRadius="20px">
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdPersonAdd} color="green.400" />}
            />
          }
          name="New Users (MTD)"
          value={val(userStats.new_users_mtd ?? "—")}
        />
      </Skeleton>

      {/* 3 — Rebalance Alerts */}
      <Skeleton isLoaded={!loading} borderRadius="20px">
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px"
              bg={rebalanceAlerts > 0 ? alertOranBg : boxBg}
              icon={
                <Icon w="28px" h="28px" as={MdSwapHoriz}
                  color={rebalanceAlerts > 0 ? "orange.500" : "gray.400"}
                />
              }
            />
          }
          name="Rebalance Alerts"
          value={val(rebalanceAlerts, rebalanceAlerts > 0 ? "orange.500" : textColor)}
        />
      </Skeleton>

      {/* 4 — Pending Reviews */}
      <Skeleton isLoaded={!loading} borderRadius="20px">
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdRateReview} color={brandColor} />}
            />
          }
          name="Pending Reviews"
          value={val(totalPendingReviews)}
        />
      </Skeleton>

      {/* 5 — Spillovers */}
      <Skeleton isLoaded={!loading} borderRadius="20px">
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px"
              bg={totalSpillovers > 0 ? alertRedBg : boxBg}
              icon={
                <Icon w="28px" h="28px" as={MdWarning}
                  color={totalSpillovers > 0 ? "red.500" : "gray.400"}
                />
              }
            />
          }
          name="Spillovers"
          value={val(totalSpillovers, totalSpillovers > 0 ? "red.500" : textColor)}
        />
      </Skeleton>

    </SimpleGrid>
  );
}
