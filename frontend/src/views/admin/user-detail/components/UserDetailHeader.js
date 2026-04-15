import {
  Card, Box, Flex, Text, Badge, Button, Icon,
  HStack, useColorModeValue,
} from "@chakra-ui/react";
import { MdArrowBack } from "react-icons/md";
import React from "react";
import StatusBadge from "views/admin/research-dashboard/components/StatusBadge";
import { formatAUM } from "./utils";

const MANDATE_COLOR = { Aggressive: "purple", Moderate: "teal", Conservative: "green" };

export default function UserDetailHeader({ user, onBack }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subColor  = useColorModeValue("secondaryGray.500", "secondaryGray.400");

  return (
    <Card p="20px" mb="20px">
      <Flex align="center" gap="16px" flexWrap="wrap">
        <Button
          leftIcon={<Icon as={MdArrowBack} />}
          size="sm" variant="ghost" onClick={onBack} flexShrink={0}>
          Back
        </Button>

        <Box flex="1" minW="200px">
          <Text color={textColor} fontSize="xl" fontWeight="700" lineHeight="1.2">
            {user.name}
          </Text>
          <Text color={subColor} fontSize="xs" fontFamily="mono" mt="2px">
            {user.accountId}
          </Text>
        </Box>

        <HStack gap="8px" flexWrap="wrap">
          <Badge colorScheme={MANDATE_COLOR[user.riskMandate] ?? "gray"} borderRadius="full" px="3" py="1">
            {user.riskMandate}
          </Badge>
          <StatusBadge status={user.status} />
          <Badge colorScheme="gray" borderRadius="full" px="3" py="1" fontSize="sm">
            AUM: {formatAUM(user.aum)}
          </Badge>
          <Badge
            colorScheme={user.drift > 8 ? "red" : user.drift > 5 ? "orange" : "green"}
            borderRadius="full" px="3" py="1" fontSize="sm">
            Drift: {user.drift.toFixed(2)}%
          </Badge>
        </HStack>

        <Box textAlign="right" flexShrink={0}>
          <Text fontSize="xs" color={subColor}>Last Review</Text>
          <Text fontSize="sm" fontWeight="600">{user.lastReview}</Text>
        </Box>
      </Flex>
    </Card>
  );
}
