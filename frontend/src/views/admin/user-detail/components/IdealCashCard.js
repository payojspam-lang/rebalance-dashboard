import {
  Box, SimpleGrid, Stat, StatLabel, StatNumber, Text, useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React from "react";
import { formatINR } from "./utils";

export default function IdealCashCard({ cashData }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const noteBg    = useColorModeValue("blue.50", "whiteAlpha.50");
  const subColor  = useColorModeValue("secondaryGray.500", "secondaryGray.400");

  const totalCosts = cashData.exitLoadCosts + cashData.estimatedTax;

  return (
    <Card p="20px" mb="20px">
      <Text color={textColor} fontSize="lg" fontWeight="700" mb="16px">
        Ideal Cash Available
      </Text>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap="16px" mb="14px">
        <Stat>
          <StatLabel fontSize="xs" color={subColor}>Liquid Holdings</StatLabel>
          <StatNumber fontSize="md" color={textColor}>{formatINR(cashData.liquidHoldings)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel fontSize="xs" color={subColor}>Expected Sell Proceeds</StatLabel>
          <StatNumber fontSize="md" color={textColor}>{formatINR(cashData.expectedSellProceeds)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel fontSize="xs" color={subColor}>Est. Costs (Tax + Exit Load)</StatLabel>
          <StatNumber fontSize="md" color="orange.400">{formatINR(totalCosts)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel fontSize="xs" color={subColor}>Net Deployable</StatLabel>
          <StatNumber fontSize="md" color="green.500" fontWeight="800">
            {formatINR(cashData.netDeployable)}
          </StatNumber>
        </Stat>
      </SimpleGrid>

      <Box bg={noteBg} borderRadius="md" px="12px" py="8px" borderLeft="3px solid" borderColor="blue.300">
        <Text fontSize="xs" color={subColor}>{cashData.note}</Text>
      </Box>
    </Card>
  );
}
