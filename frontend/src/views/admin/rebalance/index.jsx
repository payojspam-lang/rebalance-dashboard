import { Box } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UserList from "views/admin/research-dashboard/components/UserList";
import { mockUsers } from "views/admin/research-dashboard/variables/mockData";

export default function RebalancePage() {
  const navigate = useNavigate();

  const handleRowClick = useCallback(
    (userId) => navigate(`/admin/rebalance/user/${userId}`),
    [navigate]
  );

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <UserList users={mockUsers.filter((u) => u.id === "user-001" || u.id === "user-002")} onRowClick={handleRowClick} />
    </Box>
  );
}
