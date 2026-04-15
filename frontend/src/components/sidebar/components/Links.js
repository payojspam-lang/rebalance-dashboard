/* eslint-disable */
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Box, Flex, HStack, Text, Tooltip, useColorModeValue } from "@chakra-ui/react";

export function SidebarLinks({ routes, collapsed = false }) {
  const location       = useLocation();
  const activeColor    = useColorModeValue("gray.700", "white");
  const inactiveColor  = useColorModeValue("secondaryGray.600", "secondaryGray.600");
  const activeIcon     = useColorModeValue("brand.500", "white");
  const textColor      = useColorModeValue("secondaryGray.500", "white");
  const brandColor     = useColorModeValue("brand.500", "brand.400");
  const activeBg       = useColorModeValue("brand.50", "whiteAlpha.100");

  const activeRoute = (routeName) => location.pathname.includes(routeName);

  const createLinks = (routes) =>
    routes.map((route, index) => {
      if (route.hidden) return null;

      if (route.category) {
        // Hide category labels when collapsed
        if (collapsed) return null;
        return (
          <Text
            key={index}
            fontSize="md" color={activeColor} fontWeight="bold" mx="auto"
            ps={{ sm: "10px", xl: "16px" }} pt="18px" pb="12px"
          >
            {route.name}
          </Text>
        );
      }

      if (route.layout === "/admin" || route.layout === "/auth" || route.layout === "/rtl") {
        const isActive = activeRoute(route.path.toLowerCase());

        return (
          <NavLink
            key={index}
            to={route.layout + route.path}
            // WCAG fix: aria-label on the anchor so collapsed links are accessible
            // without requiring Tooltip hover (which isn't triggered by keyboard focus alone)
            aria-label={collapsed ? route.name : undefined}
          >
            {route.icon ? (
              collapsed ? (
                // ── Collapsed: icon only, centered, with tooltip ──────────
                <Tooltip label={route.name} placement="right" hasArrow>
                  <Flex
                    align="center"
                    justify="center"
                    w="44px"
                    h="44px"
                    mx="auto"
                    my="4px"
                    borderRadius="12px"
                    bg={isActive ? activeBg : "transparent"}
                    color={isActive ? activeIcon : textColor}
                    cursor="pointer"
                    _hover={{ bg: activeBg, color: activeIcon }}
                    transition="all 0.15s ease"
                  >
                    {route.icon}
                  </Flex>
                </Tooltip>
              ) : (
                // ── Expanded: icon + label ────────────────────────────────
                <Box>
                  <HStack
                    spacing={isActive ? "22px" : "26px"}
                    py="5px"
                    ps="10px"
                  >
                    <Flex w="100%" alignItems="center" justifyContent="center">
                      <Box color={isActive ? activeIcon : textColor} me="18px">
                        {route.icon}
                      </Box>
                      <Text
                        me="auto"
                        color={isActive ? activeColor : textColor}
                        fontWeight={isActive ? "bold" : "normal"}
                      >
                        {route.name}
                      </Text>
                    </Flex>
                    <Box
                      h="36px" w="4px"
                      bg={isActive ? brandColor : "transparent"}
                      borderRadius="5px"
                    />
                  </HStack>
                </Box>
              )
            ) : (
              // ── Text-only route (no icon) ─────────────────────────────
              !collapsed && (
                <Box>
                  <HStack spacing={isActive ? "22px" : "26px"} py="5px" ps="10px">
                    <Text
                      me="auto"
                      color={isActive ? activeColor : inactiveColor}
                      fontWeight={isActive ? "bold" : "normal"}
                    >
                      {route.name}
                    </Text>
                    <Box h="36px" w="4px" bg="brand.400" borderRadius="5px" />
                  </HStack>
                </Box>
              )
            )}
          </NavLink>
        );
      }
      return null;
    });

  return createLinks(routes);
}

export default SidebarLinks;
