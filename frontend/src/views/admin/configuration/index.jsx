import {
  Box, Flex, Text, Button, Tabs, TabList, Tab, TabPanels, TabPanel,
  Table, Thead, Tbody, Tr, Th, Td, Badge, IconButton, Input,
  useColorModeValue, Divider, useToast, HStack,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure,
  FormControl, FormLabel, SimpleGrid,
} from "@chakra-ui/react";
import React, { useState, useRef, useMemo } from "react";
import { MdAdd, MdDelete, MdCalendarToday } from "react-icons/md";
import Card from "components/card/Card";
import { useHolidays } from "contexts/HolidayContext";

// ── Risk Mandate Profiles data ───────────────────────────────────────────────
const RISK_MANDATES = [
  { name: "Conservative", largeCap: 60, midCap: 10,  smallCap: 0,  gold: 5,  debt: 25, thematic: 0  },
  { name: "Low",          largeCap: 50, midCap: 15,  smallCap: 5,  gold: 5,  debt: 25, thematic: 0  },
  { name: "Moderate",     largeCap: 45, midCap: 20,  smallCap: 10, gold: 5,  debt: 20, thematic: 0  },
  { name: "High",         largeCap: 40, midCap: 25,  smallCap: 15, gold: 5,  debt: 15, thematic: 0  },
  { name: "Aggressive",   largeCap: 41, midCap: 25,  smallCap: 17, gold: 1,  debt: 16, thematic: 0  },
];

const MANDATE_COLOR = {
  Conservative: "green",
  Low:          "teal",
  Moderate:     "blue",
  High:         "orange",
  Aggressive:   "purple",
};

// ── Fund Universe data ────────────────────────────────────────────────────────
const FUND_UNIVERSE = [
  {
    name:   "Nippon India Large Cap Fund",
    isin:   "INF204K01BE9",
    bucket: "Large Cap",
    rating: 5,
    rank:   2,
  },
  {
    name:   "HSBC Midcap Fund",
    isin:   "INF336L01627",
    bucket: "Mid Cap",
    rating: 4,
    rank:   1,
  },
  {
    name:   "BANDHAN Small Cap Fund",
    isin:   "INF194KB1JL1",
    bucket: "Small Cap",
    rating: 4,
    rank:   3,
  },
];

const BUCKET_COLOR = {
  "Large Cap":  "blue",
  "Mid Cap":    "orange",
  "Small Cap":  "purple",
};

function StarRating({ rating }) {
  return (
    <Flex gap="1px">
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} fontSize="sm" color={i <= rating ? "yellow.400" : "gray.300"}>
          ★
        </Text>
      ))}
    </Flex>
  );
}

// ── Risk Mandate Profiles tab ────────────────────────────────────────────────
function RiskMandatesTab() {
  const textColor   = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const subColor    = useColorModeValue("gray.500", "gray.400");
  const headerBg    = useColorModeValue("gray.50", "navy.800");

  return (
    <Box>
      <Card px="0px" overflowX="auto">
        <Flex px="20px" pt="16px" pb="12px" align="center" justify="space-between">
          <Box>
            <Text fontWeight="700" color={textColor} fontSize="md">Risk Mandate Profiles</Text>
            <Text fontSize="sm" color={subColor} mt="2px">
              Target asset allocation by risk profile (read-only)
            </Text>
          </Box>
          <Badge colorScheme="gray" borderRadius="full" fontSize="xs">Read Only</Badge>
        </Flex>
        <Divider />
        <Table variant="simple" size="sm">
          <Thead bg={headerBg}>
            <Tr>
              {["Mandate", "Large Cap %", "Mid Cap %", "Small Cap %", "Gold %", "Debt %", "Thematic %"].map((h) => (
                <Th
                  key={h}
                  borderColor={borderColor}
                  color={subColor}
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  py="12px"
                  px="20px"
                >
                  {h}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {RISK_MANDATES.map((m) => (
              <Tr key={m.name}>
                <Td px="20px" py="12px" borderColor={borderColor}>
                  <Badge colorScheme={MANDATE_COLOR[m.name]} borderRadius="full" px="2" fontSize="xs">
                    {m.name}
                  </Badge>
                </Td>
                <Td borderColor={borderColor} py="12px" fontSize="sm" color={textColor} isNumeric>{m.largeCap}%</Td>
                <Td borderColor={borderColor} py="12px" fontSize="sm" color={textColor} isNumeric>{m.midCap}%</Td>
                <Td borderColor={borderColor} py="12px" fontSize="sm" color={textColor} isNumeric>{m.smallCap}%</Td>
                <Td borderColor={borderColor} py="12px" fontSize="sm" color={textColor} isNumeric>{m.gold}%</Td>
                <Td borderColor={borderColor} py="12px" fontSize="sm" color={textColor} isNumeric>{m.debt}%</Td>
                <Td borderColor={borderColor} py="12px" fontSize="sm" color={textColor} isNumeric>{m.thematic}%</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </Box>
  );
}

// ── Fund Universe tab ────────────────────────────────────────────────────────
function FundUniverseTab() {
  const textColor   = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const subColor    = useColorModeValue("gray.500", "gray.400");
  const headerBg    = useColorModeValue("gray.50", "navy.800");

  return (
    <Box>
      <Card px="0px" overflowX="auto">
        <Flex px="20px" pt="16px" pb="12px" align="center" justify="space-between">
          <Box>
            <Text fontWeight="700" color={textColor} fontSize="md">Fund Universe</Text>
            <Text fontSize="sm" color={subColor} mt="2px">
              Approved buy-candidate funds with ratings and allocation buckets (read-only)
            </Text>
          </Box>
          <Badge colorScheme="gray" borderRadius="full" fontSize="xs">Read Only</Badge>
        </Flex>
        <Divider />
        <Table variant="simple" size="sm">
          <Thead bg={headerBg}>
            <Tr>
              {["Fund Name", "ISIN", "Bucket", "Rating", "Rank"].map((h) => (
                <Th
                  key={h}
                  borderColor={borderColor}
                  color={subColor}
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  py="12px"
                  px="20px"
                >
                  {h}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {FUND_UNIVERSE.map((f) => (
              <Tr key={f.isin}>
                <Td px="20px" py="14px" borderColor={borderColor} fontSize="sm" color={textColor} fontWeight="600">
                  {f.name}
                </Td>
                <Td borderColor={borderColor} py="14px" fontSize="xs" color={subColor} fontFamily="mono">
                  {f.isin}
                </Td>
                <Td borderColor={borderColor} py="14px">
                  <Badge colorScheme={BUCKET_COLOR[f.bucket] ?? "gray"} borderRadius="full" px="2" fontSize="xs">
                    {f.bucket}
                  </Badge>
                </Td>
                <Td borderColor={borderColor} py="14px">
                  <StarRating rating={f.rating} />
                </Td>
                <Td borderColor={borderColor} py="14px" fontSize="sm" color={textColor}>
                  #{f.rank}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </Box>
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function isEditable(year) {
  return year >= CURRENT_YEAR;
}

// ── Delete confirm dialog ───────────────────────────────────────────────────
function DeleteConfirm({ isOpen, onClose, onConfirm, holiday }) {
  const cancelRef = useRef();
  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} size="sm">
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="md">Remove Holiday</AlertDialogHeader>
          <AlertDialogBody fontSize="sm">
            Remove <strong>{holiday?.name}</strong> ({holiday?.date}) from the calendar?
          </AlertDialogBody>
          <AlertDialogFooter gap="8px">
            <Button ref={cancelRef} size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button size="sm" colorScheme="red" onClick={onConfirm}>Remove</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

// ── Holiday Calendar tab ────────────────────────────────────────────────────
function HolidayCalendarTab() {
  const { holidays, addHoliday, removeHoliday } = useHolidays();
  const toast = useToast();
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const monthBg = useColorModeValue("gray.50", "navy.800");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  // Available years: 2 years before current → next year
  const availableYears = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, NEXT_YEAR];
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");

  const { isOpen: isDelOpen, onOpen: onDelOpen, onClose: onDelClose } = useDisclosure();
  const [toDelete, setToDelete] = useState(null);

  const yearHolidays = useMemo(() => holidays[selectedYear] ?? [], [holidays, selectedYear]);

  // Group by month
  const byMonth = useMemo(() => {
    const groups = {};
    yearHolidays.forEach((h) => {
      const m = parseInt(h.date.split("-")[1], 10) - 1;
      if (!groups[m]) groups[m] = [];
      groups[m].push(h);
    });
    return groups;
  }, [yearHolidays]);

  function handleAdd() {
    if (!newDate || !newName.trim()) {
      toast({ title: "Date and name required.", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
      return;
    }
    if (!newDate.startsWith(String(selectedYear))) {
      toast({ title: `Date must be in ${selectedYear}.`, status: "error", duration: 3000, isClosable: true, position: "top-right" });
      return;
    }
    addHoliday(selectedYear, newDate, newName.trim());
    setNewDate("");
    setNewName("");
    toast({ title: "Holiday added.", status: "success", duration: 2000, isClosable: true, position: "top-right" });
  }

  function handleDeleteConfirm(h) {
    setToDelete(h);
    onDelOpen();
  }

  function handleDelete() {
    if (toDelete) {
      removeHoliday(selectedYear, toDelete.date);
      toast({ title: "Holiday removed.", status: "info", duration: 2000, isClosable: true, position: "top-right" });
    }
    setToDelete(null);
    onDelClose();
  }

  return (
    <Box>
      {/* Year tabs */}
      <Flex gap="8px" mb="20px" flexWrap="wrap">
        {availableYears.map((y) => (
          <Button
            key={y}
            size="sm"
            borderRadius="full"
            variant={selectedYear === y ? "solid" : "outline"}
            colorScheme={selectedYear === y ? "brand" : "gray"}
            onClick={() => setSelectedYear(y)}
            leftIcon={<MdCalendarToday />}
          >
            {y}
            {y === CURRENT_YEAR && <Badge ml="1" colorScheme="green" fontSize="8px" borderRadius="full">Current</Badge>}
            {y === NEXT_YEAR && <Badge ml="1" colorScheme="blue" fontSize="8px" borderRadius="full">Next</Badge>}
            {y < CURRENT_YEAR && <Badge ml="1" colorScheme="gray" fontSize="8px" borderRadius="full">Archive</Badge>}
          </Button>
        ))}
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px" alignItems="start">
        {/* ── Calendar grid by month ── */}
        <Card px="0px">
          <Flex px="20px" pt="16px" pb="12px" align="center" justify="space-between">
            <Text fontWeight="700" color={textColor} fontSize="md">
              {selectedYear} BSE Holidays
            </Text>
            <Badge colorScheme={isEditable(selectedYear) ? "green" : "gray"} borderRadius="full">
              {isEditable(selectedYear) ? "Editable" : "Archive — Read Only"}
            </Badge>
          </Flex>
          <Divider />
          {yearHolidays.length === 0 ? (
            <Flex py="40px" justify="center">
              <Text color={subColor} fontSize="sm">No holidays configured for {selectedYear}.</Text>
            </Flex>
          ) : (
            <Box>
              {Object.keys(byMonth).sort((a, b) => a - b).map((mIdx) => (
                <Box key={mIdx}>
                  <Box px="20px" py="8px" bg={monthBg}>
                    <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="wider">
                      {MONTH_NAMES[mIdx]}
                    </Text>
                  </Box>
                  {byMonth[mIdx].map((h) => (
                    <Flex key={h.date} px="20px" py="10px" align="center" gap="12px"
                      borderBottom="1px solid" borderColor={borderColor}
                      _hover={{ bg: rowHoverBg }}>
                      <Text fontSize="sm" fontFamily="mono" color="brand.500" fontWeight="700" minW="32px">
                        {h.date.split("-")[2]}
                      </Text>
                      <Text fontSize="sm" color={textColor} flex="1">{h.name}</Text>
                      <Text fontSize="xs" color={subColor}>{h.date}</Text>
                      {isEditable(selectedYear) && (
                        <IconButton
                          aria-label="Remove holiday"
                          icon={<MdDelete />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteConfirm(h)}
                        />
                      )}
                    </Flex>
                  ))}
                </Box>
              ))}
            </Box>
          )}
          <Flex px="20px" py="10px" justify="flex-end">
            <Text fontSize="xs" color={subColor}>{yearHolidays.length} holiday{yearHolidays.length !== 1 ? "s" : ""}</Text>
          </Flex>
        </Card>

        {/* ── Add new holiday ── */}
        {isEditable(selectedYear) && (
          <Card p="20px">
            <Text fontWeight="700" color={textColor} mb="4px">Add Holiday</Text>
            <Text fontSize="sm" color={subColor} mb="16px">
              Add a BSE market-closure date for {selectedYear}.
            </Text>
            <FormControl mb="14px">
              <FormLabel fontSize="sm">Date</FormLabel>
              <Input
                type="date"
                size="sm"
                borderRadius="md"
                min={`${selectedYear}-01-01`}
                max={`${selectedYear}-12-31`}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </FormControl>
            <FormControl mb="16px">
              <FormLabel fontSize="sm">Holiday Name</FormLabel>
              <Input
                size="sm"
                borderRadius="md"
                placeholder="e.g. Republic Day"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </FormControl>
            <Button size="sm" colorScheme="brand" leftIcon={<MdAdd />} onClick={handleAdd} w="100%">
              Add Holiday
            </Button>
          </Card>
        )}
      </SimpleGrid>

      <DeleteConfirm
        isOpen={isDelOpen}
        onClose={onDelClose}
        onConfirm={handleDelete}
        holiday={toDelete}
      />
    </Box>
  );
}

// ── Main Configuration page ─────────────────────────────────────────────────
export default function ConfigurationPage() {
  const textColor = useColorModeValue("gray.800", "white");

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Box mb="24px">
        <Text color={textColor} fontSize="2xl" fontWeight="700">Configuration</Text>
        <Text color="gray.500" fontSize="sm">Manage system settings and market calendars.</Text>
      </Box>

      <Tabs variant="soft-rounded" colorScheme="brand" isLazy>
        <TabList mb="20px" gap="8px" flexWrap="wrap">
          <Tab fontSize="sm" fontWeight="600">
            Holiday Calendar
          </Tab>
          <Tab fontSize="sm" fontWeight="600">
            Risk Mandates
          </Tab>
          <Tab fontSize="sm" fontWeight="600">
            Fund Universe
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel px="0" pt="0">
            <HolidayCalendarTab />
          </TabPanel>
          <TabPanel px="0" pt="0">
            <RiskMandatesTab />
          </TabPanel>
          <TabPanel px="0" pt="0">
            <FundUniverseTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
