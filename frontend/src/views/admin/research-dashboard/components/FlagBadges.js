import { Flex, Tag, TagLabel, Tooltip } from "@chakra-ui/react";
import React from "react";

const FLAG_META = {
  flagUnder2Pct:         { label: "<2%",     color: "orange", tip: "Holding is under 2% of portfolio" },
  flagOver25Pct:         { label: ">25%",    color: "red",    tip: "Holding is over 25% of portfolio" },
  flagThreeOver5:        { label: "3★>5%",   color: "yellow", tip: "3★ fund exceeding 5% weight cap" },
  flagLockinCategory:    { label: "ELSS",    color: "purple", tip: "Fund is in a lock-in category (ELSS)" },
  flagSoldDueToLockin:   { label: "LOCKIN",  color: "purple", tip: "Sold due to lock-in completion" },
  flagSoldLowRating:     { label: "LOW★",    color: "red",    tip: "Sold due to low rating rule" },
  flagSoldOverlap:       { label: "OVERLAP", color: "orange", tip: "Sold due to category overlap" },
  flagTrim3StarCap:      { label: "TRIM",    color: "yellow", tip: "Trimmed to 3★ 5% cap" },
  flagDebtRotation:      { label: "DEBT",    color: "blue",   tip: "Debt rotation category" },
  flagSoldDebtRotation:  { label: "ROTATED", color: "blue",   tip: "Sold due to debt rotation" },
};

export default function FlagBadges({ flags = {} }) {
  const activeFlags = Object.entries(flags).filter(([, v]) => v === true);
  if (activeFlags.length === 0) return null;

  return (
    <Flex gap="4px" flexWrap="wrap">
      {activeFlags.map(([key]) => {
        const meta = FLAG_META[key];
        if (!meta) return null;
        return (
          <Tooltip key={key} label={meta.tip} fontSize="xs" hasArrow>
            <Tag size="sm" colorScheme={meta.color} borderRadius="full" cursor="default">
              <TagLabel fontSize="9px" fontWeight="700">
                {meta.label}
              </TagLabel>
            </Tag>
          </Tooltip>
        );
      })}
    </Flex>
  );
}
