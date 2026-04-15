import { Box, Flex, Stack } from "@chakra-ui/react";
import Brand from "components/sidebar/components/Brand";
import Links from "components/sidebar/components/Links";
import React from "react";

function SidebarContent({ routes, collapsed = false }) {
  return (
    <Flex
      direction="column"
      height="100%"
      pt="25px"
      px={collapsed ? "8px" : "16px"}
      borderRadius="30px"
      transition="padding 0.25s ease"
    >
      {/* Hide brand logo text when collapsed; keep icon only */}
      {!collapsed && <Brand />}
      {collapsed && <Box h="40px" mb="8px" />}

      <Stack direction="column" mb="auto" mt="8px">
        <Box
          ps={collapsed ? "4px" : "20px"}
          pe={collapsed ? "4px" : { md: "16px", "2xl": "1px" }}
          transition="padding 0.25s ease"
        >
          <Links routes={routes} collapsed={collapsed} />
        </Box>
      </Stack>
    </Flex>
  );
}

export default SidebarContent;
