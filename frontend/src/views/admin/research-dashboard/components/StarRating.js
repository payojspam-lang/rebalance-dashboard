import { Flex, Icon } from "@chakra-ui/react";
import { MdStar, MdStarBorder } from "react-icons/md";
import React from "react";

const STAR_COLOR = {
  5: "green.400",
  4: "blue.400",
  3: "yellow.400",
  2: "orange.400",
  1: "red.400",
};

export default function StarRating({ rating }) {
  const color = STAR_COLOR[rating] ?? "gray.400";
  return (
    <Flex align="center" gap="1px">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          as={i <= rating ? MdStar : MdStarBorder}
          color={i <= rating ? color : "gray.300"}
          w="14px"
          h="14px"
        />
      ))}
    </Flex>
  );
}
