import React from "react";
import {
  Box,
  Flex,
  Drawer,
  DrawerBody,
  Icon,
  IconButton,
  Tooltip,
  useColorModeValue,
  DrawerOverlay,
  useDisclosure,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import Content from "components/sidebar/components/Content";
import PropTypes from "prop-types";
import { IoMenuOutline } from "react-icons/io5";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

// ── Desktop sidebar — collapsible ────────────────────────────────────────────

function Sidebar({ routes, collapsed = false, onToggleCollapse }) {
  const shadow    = useColorModeValue(
    "14px 17px 40px 4px rgba(112, 144, 176, 0.08)",
    "unset",
  );
  const sidebarBg    = useColorModeValue("white", "navy.800");
  const toggleBg     = useColorModeValue("white", "navy.700");
  const toggleShadow = useColorModeValue("0 2px 8px rgba(0,0,0,0.12)", "0 2px 8px rgba(0,0,0,0.4)");
  const toggleColor  = useColorModeValue("gray.600", "white");

  const sidebarW = collapsed ? "72px" : "290px";

  return (
    <Box
      display={{ sm: "none", xl: "block" }}
      w={sidebarW}
      position="fixed"
      minH="100%"
      zIndex="1000"
      transition="width 0.25s ease"
    >
      <Box
        bg={sidebarBg}
        w={sidebarW}
        h="100vh"
        minH="100%"
        overflowX="hidden"
        overflowY="auto"
        boxShadow={shadow}
        transition="width 0.25s ease"
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.1)", borderRadius: "4px" },
        }}
      >
        {/* Collapse / expand toggle button — pinned to right edge */}
        <Tooltip
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          placement="right"
          hasArrow
        >
          <IconButton
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            icon={<Icon as={collapsed ? MdChevronRight : MdChevronLeft} w="18px" h="18px" />}
            size="sm"
            position="absolute"
            top="20px"
            right="-14px"
            zIndex="1001"
            borderRadius="full"
            bg={toggleBg}
            color={toggleColor}
            boxShadow={toggleShadow}
            border="1px solid"
            borderColor={useColorModeValue("gray.200", "whiteAlpha.200")}
            _hover={{ bg: useColorModeValue("gray.100", "navy.600") }}
            onClick={onToggleCollapse}
          />
        </Tooltip>

        {/* Sidebar content — pass collapsed prop so Content can hide labels */}
        <Content routes={routes} collapsed={collapsed} />
      </Box>
    </Box>
  );
}

// ── Mobile sidebar — Drawer (unchanged) ──────────────────────────────────────

export function SidebarResponsive({ routes }) {
  const sidebarBg = useColorModeValue("white", "navy.800");
  const menuColor = useColorModeValue("gray.400", "white");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef();

  return (
    <Flex display={{ sm: "flex", xl: "none" }} alignItems="center">
      <Flex ref={btnRef} w="max-content" h="max-content" onClick={onOpen}>
        <Icon
          as={IoMenuOutline}
          color={menuColor}
          my="auto"
          w="20px"
          h="20px"
          me="10px"
          _hover={{ cursor: "pointer" }}
        />
      </Flex>
      <Drawer isOpen={isOpen} onClose={onClose} placement="left" finalFocusRef={btnRef}>
        <DrawerOverlay />
        <DrawerContent w="285px" maxW="285px" bg={sidebarBg}>
          <DrawerCloseButton zIndex="3" _focus={{ boxShadow: "none" }} _hover={{ boxShadow: "none" }} />
          <DrawerBody maxW="285px" px="0rem" pb="0" overflowY="auto">
            <Content routes={routes} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}

Sidebar.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object),
  collapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
};

export default Sidebar;
