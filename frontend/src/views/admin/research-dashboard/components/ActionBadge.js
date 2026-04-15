import { Badge } from "@chakra-ui/react";
import React from "react";

const ACTION_CONFIG = {
  "BUY":       { label: "BUY",       colorScheme: "green"  },
  "SELL":      { label: "SELL",      colorScheme: "red"    },
  "HOLD":      { label: "HOLD",      colorScheme: "blue"   },
  "TRIM/HOLD": { label: "TRIM/HOLD", colorScheme: "orange" },
};

export default function ActionBadge({ action }) {
  const config = ACTION_CONFIG[action] ?? { label: action, colorScheme: "gray" };
  return (
    <Badge colorScheme={config.colorScheme} borderRadius="full" px="2" fontSize="xs" fontWeight="700">
      {config.label}
    </Badge>
  );
}
