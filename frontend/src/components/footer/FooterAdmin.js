import React from "react";
import { Flex, Text, useColorModeValue } from "@chakra-ui/react";

export default function Footer() {
  const textColor = useColorModeValue("gray.400", "whiteAlpha.500");
  return (
    <Flex
      zIndex="3"
      alignItems="center"
      justifyContent="center"
      px={{ base: "30px", md: "50px" }}
      pb="30px"
    >
      <Text color={textColor} fontSize="sm">
        &copy; {new Date().getFullYear()} Vantage. All rights reserved.
      </Text>
    </Flex>
  );
}
