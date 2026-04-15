import {
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdSearch, MdExpandMore, MdClose } from "react-icons/md";
import React from "react";

const STATUS_OPTIONS = [
  { value: "PENDING",     label: "Pending" },
  { value: "L2_PENDING",  label: "L2 Review" },
  { value: "APPROVED",    label: "Approved" },
  { value: "REJECTED",    label: "Rejected" },
];

const ACTION_OPTIONS = [
  { value: "BUY",       label: "Buy" },
  { value: "SELL",      label: "Sell" },
  { value: "HOLD",      label: "Hold" },
  { value: "TRIM/HOLD", label: "Trim/Hold" },
];

const RATING_OPTIONS = [
  { value: "5", label: "5★" },
  { value: "4", label: "4★" },
  { value: "3", label: "3★" },
  { value: "2", label: "2★" },
  { value: "1", label: "1★" },
];

function PillDropdown({ label, options, value, onChange }) {
  const active = value !== "";
  const activeLabel = options.find((o) => o.value === value)?.label;
  const activeBg    = useColorModeValue("brand.500", "brand.400");
  const inactiveBg  = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");

  return (
    <Menu placement="bottom-start">
      <MenuButton
        as={Button}
        size="sm"
        borderRadius="full"
        border="1px solid"
        borderColor={active ? "transparent" : borderColor}
        bg={active ? activeBg : inactiveBg}
        color={active ? "white" : "inherit"}
        fontWeight={active ? "600" : "400"}
        fontSize="sm"
        px="14px"
        rightIcon={
          active
            ? <MdClose style={{ marginLeft: -4 }} onClick={(e) => { e.stopPropagation(); onChange(""); }} />
            : <MdExpandMore />
        }
        _hover={{ opacity: 0.85 }}
        _active={{ opacity: 0.85 }}
      >
        {active ? activeLabel : label}
      </MenuButton>
      <MenuList minW="150px" shadow="md" borderRadius="md" fontSize="sm">
        {active && (
          <MenuItem onClick={() => onChange("")} color="gray.400">
            All {label}s
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            fontWeight={opt.value === value ? "700" : "400"}
          >
            {opt.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}

export default function FilterBar({ filters, onChange, onReset }) {
  const borderColor  = useColorModeValue("gray.200", "whiteAlpha.200");
  const inputBg      = useColorModeValue("white", "navy.700");
  const activeCount  = [filters.status, filters.action, filters.rating]
    .filter(Boolean).length + (filters.search ? 1 : 0);

  return (
    <Flex
      gap="8px"
      flexWrap="wrap"
      align="center"
      px="25px"
      py="12px"
      borderBottom="1px solid"
      borderColor={borderColor}
    >
      <PillDropdown
        label="Status"
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(v) => onChange("status", v)}
      />
      <PillDropdown
        label="Action"
        options={ACTION_OPTIONS}
        value={filters.action}
        onChange={(v) => onChange("action", v)}
      />
      <PillDropdown
        label="Rating"
        options={RATING_OPTIONS}
        value={filters.rating}
        onChange={(v) => onChange("rating", v)}
      />

      <InputGroup size="sm" maxW="220px">
        <InputLeftElement pointerEvents="none">
          <MdSearch color="gray" />
        </InputLeftElement>
        <Input
          borderRadius="full"
          bg={inputBg}
          border="1px solid"
          borderColor={borderColor}
          placeholder="Search fund / ISIN"
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
          fontSize="sm"
        />
      </InputGroup>

      {activeCount > 0 && (
        <Button
          size="sm"
          variant="ghost"
          colorScheme="gray"
          leftIcon={<MdClose />}
          onClick={onReset}
          fontSize="sm"
        >
          Clear ({activeCount})
        </Button>
      )}
    </Flex>
  );
}
