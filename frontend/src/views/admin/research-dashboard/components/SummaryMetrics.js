import { SimpleGrid, Box, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import React from "react";
import {
  MdPersonAdd, MdSync, MdTrendingUp, MdAccountBalance,
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

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdPersonAdd} color="brand.500" />} />}
          name="New Users (Review Needed)"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.newUsersPendingReview}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdSync} color="orange.400" />} />}
          name="Old Users (Monthly Rebalance)"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{metrics.oldUsersPendingRebalance}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdTrendingUp} color="green.500" />} />}
          name="AUM Added (Last 30 Days)"
          value={<Text fontSize="2xl" fontWeight="700" color="green.500">+{formatAUM(metrics.aumAdded30Days)}</Text>}
        />
        <MiniStatistics
          startContent={<IconBox w="56px" h="56px" bg={boxBg} icon={<Icon w="28px" h="28px" as={MdAccountBalance} color={brandColor} />} />}
          name="Total AUM"
          value={<Text fontSize="2xl" fontWeight="700" color={textColor}>{formatAUM(metrics.totalAum)}</Text>}
        />
      </SimpleGrid>
    </Box>
  );
}
