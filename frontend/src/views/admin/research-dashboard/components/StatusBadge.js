import { Badge } from "@chakra-ui/react";
import React from "react";

const STATUS_CONFIG = {
  PENDING:        { label: "Pending",        colorScheme: "yellow"  },
  L2_PENDING:     { label: "L2 Review",      colorScheme: "blue"    },
  REJECTED:       { label: "Rejected",       colorScheme: "red"     },
  APPROVED:       { label: "Approved",       colorScheme: "green"   },
  IN_PROGRESS:    { label: "In Progress",    colorScheme: "purple"  },
  COMPLETED:      { label: "Completed",      colorScheme: "gray"    },
  PENDING_REVIEW: { label: "Pending Review", colorScheme: "orange"  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, colorScheme: "gray" };
  return (
    <Badge colorScheme={config.colorScheme} borderRadius="full" px="2" fontSize="xs">
      {config.label}
    </Badge>
  );
}
