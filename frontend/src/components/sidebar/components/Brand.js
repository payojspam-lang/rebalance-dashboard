import React from "react";
import { Flex } from "@chakra-ui/react";
import { HSeparator } from "components/separator/Separator";
import VantageLogo from "components/brand/VantageLogo";

export function SidebarBrand() {
  return (
    <Flex align="center" direction="column">
      <VantageLogo compact my="20px" />
      <HSeparator mb="20px" />
    </Flex>
  );
}

export default SidebarBrand;
