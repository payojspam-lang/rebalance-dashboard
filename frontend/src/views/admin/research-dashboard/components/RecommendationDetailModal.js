import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton,
  Button, Box, Flex, Text, Divider, SimpleGrid,
  useColorModeValue, Progress, Tooltip,
  Select, NumberInput, NumberInputField, Textarea,
  FormControl, FormLabel, Badge, Alert, AlertIcon,
  FormHelperText, Tag, TagLabel,
} from "@chakra-ui/react";
import React, { useState, useEffect, useMemo } from "react";
import ActionBadge from "./ActionBadge";
import FlagBadges from "./FlagBadges";
import StarRating from "./StarRating";
import { MdSave } from "react-icons/md";
import { useHolidays } from "contexts/HolidayContext";
import { calcExecutionDate, formatExecDate } from "utils/executionDate";

const DEVIATION_THRESHOLD_PCT = 5;

function formatINR(amount) {
  if (!amount && amount !== 0) return "—";
  if (amount === 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

function pctDiff(newVal, original) {
  if (!original || original === 0) return 0;
  return Math.abs((newVal - original) / original) * 100;
}

function StatLine({ label, value }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  return (
    <Flex justify="space-between" py="6px" borderBottom="1px dashed" borderColor="gray.200">
      <Text fontSize="sm" color="gray.600">{label}</Text>
      <Text fontSize="sm" fontWeight="600" color="gray.800">{value}</Text>
    </Flex>
  );
}

function SellabilityGauge({ label, value, colorScheme }) {
  return (
    <Box mb="8px">
      <Flex justify="space-between" mb="3px">
        <Text fontSize="xs" color="secondaryGray.600">{label}</Text>
        <Text fontSize="xs" fontWeight="700">{value.toFixed(1)}%</Text>
      </Flex>
      <Progress value={value} size="sm" colorScheme={colorScheme} borderRadius="full" />
    </Box>
  );
}

export default function RecommendationDetailModal({
  rec,
  isOpen,
  onClose,
  readOnly = false,
  nav,
  editState,        // { action, amount, qty, notes } from table's edits
  onEditChange,     // (field, value) => void — updates table's edits
  onSaveDraft,      // () => void
  onSubmit,         // () => void
  onSubmitForReview,// () => void
}) {
  const textColor = useColorModeValue("gray.800", "white");
  const subColor  = useColorModeValue("gray.600", "secondaryGray.400");
  const bgCard    = useColorModeValue("gray.50", "navy.800");
  const bgLeftPanel = useColorModeValue("white", "navy.900");
  const borderCol = useColorModeValue("gray.200", "whiteAlpha.200");

  const { getHolidaySet } = useHolidays();

  // Build a combined holiday set for current year + adjacent years
  const holidaySet = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const combined = new Set([
      ...getHolidaySet(y - 1),
      ...getHolidaySet(y),
      ...getHolidaySet(y + 1),
    ]);
    return combined;
  }, [getHolidaySet]);

  // Local copy of edits for the modal — sync'd from parent on open
  const [localAction, setLocalAction] = useState("");
  const [localAmount, setLocalAmount] = useState(0);
  const [localQty,    setLocalQty]    = useState(0);
  const [localNotes,  setLocalNotes]  = useState("");
  const [localPct,    setLocalPct]    = useState(0);

  // Execution date — recalculated based on the current action
  const execInfo = useMemo(() => {
    const action = localAction || "SELL";
    const bseAction = action === "TRIM" ? "SELL" : action;
    return calcExecutionDate(bseAction, new Date(), holidaySet);
  }, [localAction, holidaySet]);

  useEffect(() => {
    if (rec && isOpen) {
      const startingAction = editState?.action ?? rec.mlAction ?? rec.recommendedAction;
      setLocalAction(startingAction === "TRIM/HOLD" ? "TRIM" : startingAction);
      
      const startingAmt = editState?.amount ?? rec.mlAmount ?? rec.amount ?? 0;
      setLocalAmount(startingAmt);
      if (rec.currentValue > 0) {
        setLocalPct(parseFloat(((startingAmt / rec.currentValue) * 100).toFixed(2)));
      }
      
      setLocalQty(editState?.qty    ?? rec.mlQty    ?? rec.qty    ?? 0);
      setLocalNotes(editState?.notes  ?? rec.draftNotes ?? "");
    }
  }, [rec, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rec) return null;

  const isPending = rec.status === "PENDING" && !readOnly;
  const isSell    = rec.mlAction === "SELL" || rec.mlAction === "TRIM/HOLD" || rec.mlAction === "TRIM";

  // Deviation checks
  const normalizedMlAction = (rec.mlAction ?? rec.recommendedAction) === "TRIM/HOLD" 
    ? "TRIM" 
    : (rec.mlAction ?? rec.recommendedAction);
  const actionDeviated = localAction !== normalizedMlAction;
  const amtDevPct      = pctDiff(localAmount, rec.mlAmount ?? rec.amount);
  const qtyDevPct      = pctDiff(localQty, rec.mlQty ?? rec.qty);
  const amtDeviated    = amtDevPct > DEVIATION_THRESHOLD_PCT;
  const qtyDeviated    = qtyDevPct > DEVIATION_THRESHOLD_PCT;
  const anyDeviation   = actionDeviated || amtDeviated || qtyDeviated;

  function pushChange(field, value) {
    if (field === "action") setLocalAction(value === "TRIM/HOLD" ? "TRIM" : value);
    if (field === "amount") {
      setLocalAmount(value);
      if (rec.currentValue > 0) {
        setLocalPct(parseFloat(((value / rec.currentValue) * 100).toFixed(2)));
      }
    }
    if (field === "qty")    setLocalQty(value);
    if (field === "notes")  setLocalNotes(value);
    onEditChange?.(field, value === "TRIM" ? "TRIM" : value);
  }

  function handleSaveDraft() {
    onSaveDraft?.();
    onClose();
  }

  function handleSubmit() {
    onSubmit?.();
    onClose();
  }

  function handleSubmitForReview() {
    onSubmitForReview?.();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
      <ModalContent maxH="90vh" overflow="hidden">

        {/* ── Header ── */}
        <ModalHeader pb="0" borderBottom="1px solid" borderColor="gray.200">
          <Flex align="flex-start" gap="12px" flexWrap="wrap" pr="40px">
            <Box flex="1">
              <Text fontSize="lg" fontWeight="700" color={textColor} lineHeight="1.3">
                {rec.assetName}
              </Text>
              <Text fontSize="xs" color="gray.500" mt="2px" fontFamily="mono">
                {rec.isin}
              </Text>
            </Box>
            <Flex gap="8px" align="center" mt="4px" flexWrap="wrap">
              <StarRating rating={rec.rating} />
              <ActionBadge action={(rec.mlAction ?? rec.recommendedAction) === "TRIM/HOLD" ? "TRIM" : (rec.mlAction ?? rec.recommendedAction)} />
              {isPending && (
                <Badge colorScheme="orange" borderRadius="full" px="2" fontSize="xs">
                  Pending Review
                </Badge>
              )}
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top="16px" />

        {/* ── Body: two-column ── */}
        <ModalBody p="0" display="flex" overflow="hidden" flex="1" minH="0">

          {/* Left — ML reference details */}
          <Box
            w={{ base: "100%", md: "45%" }}
            bg={bgLeftPanel}
            borderRight="1px solid"
            borderColor={borderCol}
            overflowY="auto"
            flexShrink={0}
          >
            <Box px="20px" py="12px" borderBottom="1px solid" borderColor="gray.200">
              <Text fontSize="11px" fontWeight="700" color="blue.500"
                textTransform="uppercase" letterSpacing="wider">
                ML Recommendation
              </Text>
              <Text fontSize="xs" color="gray.500">System-generated signal</Text>
            </Box>
            <Box p="20px">

            {/* ML values row */}
            <Flex gap="16px" mb="14px" flexWrap="wrap">
              <Box>
                <Text fontSize="10px" color="gray.500" mb="3px">Action</Text>
                <ActionBadge action={(rec.mlAction ?? rec.recommendedAction) === "TRIM/HOLD" ? "TRIM" : (rec.mlAction ?? rec.recommendedAction)} />
              </Box>
              {(rec.mlAmount ?? rec.amount) > 0 && (
                <Box>
                  <Text fontSize="10px" color="gray.500" mb="3px">Amount</Text>
                  <Text fontSize="sm" fontWeight="700" color={textColor}>
                    {formatINR(rec.mlAmount ?? rec.amount)}
                  </Text>
                </Box>
              )}
              {(rec.mlQty ?? rec.qty) > 0 && (
                <Box>
                  <Text fontSize="10px" color="gray.500" mb="3px">Qty (units)</Text>
                  <Text fontSize="sm" fontWeight="700" color={textColor}>
                    {(rec.mlQty ?? rec.qty).toLocaleString("en-IN")}
                  </Text>
                </Box>
              )}
              <Box>
                <Text fontSize="10px" color="gray.500" mb="3px">Current Weight</Text>
                <Text fontSize="sm" fontWeight="600">
                  {rec.currentWeight > 0 ? `${rec.currentWeight.toFixed(2)}%` : "New Position"}
                </Text>
              </Box>
              <Box>
                <Text fontSize="10px" color="gray.500" mb="3px">Current Value</Text>
                <Text fontSize="sm" fontWeight="600">
                  {rec.currentValue > 0 ? formatINR(rec.currentValue) : "—"}
                </Text>
              </Box>
              <Box>
                <Text fontSize="10px" color="gray.500" mb="3px">NAV</Text>
                <Text fontSize="sm" fontWeight="600">
                  {nav ? formatINR(nav) : "—"}
                </Text>
              </Box>
            </Flex>

            {/* ML Comment */}
            {rec.comment && (
              <Box bg={bgCard} borderRadius="md" p="12px" mb="14px">
                <Text fontSize="10px" fontWeight="700" color="gray.500" mb="6px"
                  textTransform="uppercase" letterSpacing="wider">
                  ML Comment
                </Text>
                <Text fontSize="sm" color={textColor} lineHeight="1.6">
                  {rec.comment}
                </Text>
              </Box>
            )}

            {/* Flags */}
            {rec.flags && Object.values(rec.flags).some(Boolean) && (
              <Box mb="14px">
                <Text fontSize="10px" fontWeight="700" color="gray.500" mb="6px"
                  textTransform="uppercase" letterSpacing="wider">
                  Active Flags
                </Text>
                <FlagBadges flags={rec.flags} />
              </Box>
            )}

            {/* Sellability */}
            {isSell && (
              <>
                <Divider mb="12px" />
                <Text fontSize="10px" fontWeight="700" color="gray.500" mb="10px"
                  textTransform="uppercase" letterSpacing="wider">
                  Sellability
                </Text>
                <SellabilityGauge label="In STCG Window"    value={rec.pctValueInStcg}    colorScheme="orange" />
                <SellabilityGauge label="Under Exit Load"   value={rec.pctValueInExitLoad} colorScheme="red" />
                <SellabilityGauge label="Freely Sellable"   value={rec.pctValueSellableNow} colorScheme="green" />

                <Divider mt="6px" mb="12px" />
                <Text fontSize="10px" fontWeight="700" color="gray.500" mb="6px"
                  textTransform="uppercase" letterSpacing="wider">
                  Cost Estimate
                </Text>
                <Box bg={bgCard} borderRadius="md" px="12px" pt="4px" pb="8px">
                  <StatLine label="Sell Amount"           value={formatINR(rec.mlAmount ?? rec.amount)} />
                  <StatLine label="Exit Load Incurred"    value={formatINR(rec.exitAmtSold)} />
                  <StatLine label="Estimated Tax"         value={formatINR(rec.taxEstAmtSold)} />
                  <StatLine label="Realized Capital Gain" value={formatINR(rec.realizedGainSold)} />
                  <StatLine label="Net Cash (after costs)"
                    value={formatINR((rec.mlAmount ?? rec.amount) - (rec.exitAmtSold ?? 0) - (rec.taxEstAmtSold ?? 0))} />
                </Box>
                <Text fontSize="10px" color="gray.500" mt="6px">
                  * Tax figures are estimates. Reconcile with AMC statements post-execution.
                </Text>
              </>
            )}
            </Box>{/* end inner p="20px" box */}
          </Box>

          {/* Right — Editable form */}
          <Box flex="1" overflowY="auto">
            <Box px="20px" py="12px" borderBottom="1px solid" borderColor="gray.200">
              <Text fontSize="11px" fontWeight="700" color="green.500"
                textTransform="uppercase" letterSpacing="wider">
                Research Team Action
              </Text>
              <Text fontSize="xs" color="gray.500">Analyst override &amp; notes</Text>
            </Box>
            <Box p="20px">
            {isPending ? (
              <>
                {/* Execution date */}
                <Box mb="16px" bg="gray.50" borderRadius="md" p="12px" borderLeft="3px solid" borderColor="brand.400">
                  <Text fontSize="10px" fontWeight="700" color="gray.500" mb="6px"
                    textTransform="uppercase" letterSpacing="wider">
                    Execution Date
                  </Text>
                  <Flex align="center" gap="10px" flexWrap="wrap">
                    <Text fontSize="lg" fontWeight="800" color="brand.500">
                      {formatExecDate(execInfo.execDate)}
                    </Text>
                    <Tag colorScheme="brand" borderRadius="full" size="sm">
                      <TagLabel>{execInfo.settlementLabel}</TagLabel>
                    </Tag>
                    {execInfo.cutoffMissed && (
                      <Badge colorScheme="orange" borderRadius="full" fontSize="9px">
                        After 12:30 PM cutoff
                      </Badge>
                    )}
                  </Flex>
                  <Text fontSize="10px" color="gray.400" mt="4px">
                    {localAction === "BUY"
                      ? "Buy orders settle T+3 (before 12:30 PM) or T+4 (after)"
                      : "Sell/Trim orders settle T (before 12:30 PM) or T+1 (after)"}
                    {" · "}BSE working days only
                  </Text>
                </Box>

                {/* Deviation alert */}
                {anyDeviation && (
                  <Alert status="warning" borderRadius="md" mb="14px" py="8px">
                    <AlertIcon />
                    <Text fontSize="sm">
                      This edit deviates from the ML recommendation.
                    </Text>
                  </Alert>
                )}

                {/* Action */}
                <FormControl mb="14px">
                  <FormLabel fontSize="sm" fontWeight="600">
                    Action
                    {actionDeviated && (
                      <Badge colorScheme="orange" ml="2" borderRadius="full" fontSize="9px">
                        Changed from ML
                      </Badge>
                    )}
                  </FormLabel>
                  <Select
                    size="sm"
                    borderRadius="md"
                    value={localAction}
                    onChange={(e) => pushChange("action", e.target.value)}
                    borderColor={actionDeviated ? "orange.400" : undefined}
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="HOLD">HOLD</option>
                    <option value="TRIM">TRIM</option>
                  </Select>
                </FormControl>

                {/* Trim Percentage */}
                {localAction === "TRIM" && (
                  <FormControl mb="14px">
                    <FormLabel fontSize="sm" fontWeight="600">
                      Trim Percentage (%)
                    </FormLabel>
                    <NumberInput
                      size="sm"
                      value={localPct}
                      onChange={(val) => {
                        const p = Number(val);
                        setLocalPct(p);
                        if (rec.currentValue > 0 && !isNaN(p)) {
                          const calcAmt = Number((rec.currentValue * (p / 100)).toFixed(2));
                          pushChange("amount", calcAmt);
                        }
                      }}
                      min={0} max={100}
                    >
                      <NumberInputField borderRadius="md" />
                    </NumberInput>
                    <FormHelperText fontSize="xs" color="gray.400">
                      % of current value: {formatINR(rec.currentValue)}
                    </FormHelperText>
                  </FormControl>
                )}

                {/* Amount */}
                {localAction !== "HOLD" && (
                  <FormControl mb="14px">
                    <FormLabel fontSize="sm" fontWeight="600">
                      Amount (₹)
                      {amtDeviated && (
                        <Badge colorScheme="orange" ml="2" borderRadius="full" fontSize="9px">
                          {amtDevPct.toFixed(1)}% deviation
                        </Badge>
                      )}
                    </FormLabel>
                    <NumberInput
                      size="sm"
                      value={localAmount}
                      onChange={(val) => pushChange("amount", Number(val))}
                      min={0}
                    >
                      <NumberInputField
                        borderRadius="md"
                        borderColor={amtDeviated ? "orange.400" : undefined}
                      />
                    </NumberInput>
                    {amtDevPct > 0 && (
                      <FormHelperText fontSize="xs" color={amtDeviated ? "orange.500" : "gray.400"}>
                        ML: {formatINR(rec.mlAmount ?? rec.amount)} · Δ {amtDevPct.toFixed(1)}%
                      </FormHelperText>
                    )}
                  </FormControl>
                )}

                {/* Qty */}
                {localAction !== "HOLD" && (
                  <FormControl mb="14px">
                    <FormLabel fontSize="sm" fontWeight="600">
                      Qty (units)
                      {qtyDeviated && (
                        <Badge colorScheme="orange" ml="2" borderRadius="full" fontSize="9px">
                          {qtyDevPct.toFixed(1)}% deviation
                        </Badge>
                      )}
                    </FormLabel>
                    <NumberInput
                      size="sm"
                      value={localQty}
                      onChange={(val) => pushChange("qty", Number(val))}
                      min={0}
                    >
                      <NumberInputField
                        borderRadius="md"
                        borderColor={qtyDeviated ? "orange.400" : undefined}
                      />
                    </NumberInput>
                    {qtyDevPct > 0 && (
                      <FormHelperText fontSize="xs" color={qtyDeviated ? "orange.500" : "gray.400"}>
                        ML: {(rec.mlQty ?? rec.qty ?? 0).toLocaleString("en-IN")} units · Δ {qtyDevPct.toFixed(1)}%
                      </FormHelperText>
                    )}
                  </FormControl>
                )}

                {/* Notes / Rationale */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Notes
                    {anyDeviation && (
                      <Text as="span" color="red.400" ml="1">*</Text>
                    )}
                  </FormLabel>
                  <Textarea
                    size="sm"
                    rows={4}
                    borderRadius="md"
                    placeholder={
                      anyDeviation
                        ? "Rationale required when deviating from ML recommendation..."
                        : "Optional notes..."
                    }
                    value={localNotes}
                    onChange={(e) => pushChange("notes", e.target.value)}
                  />
                  {anyDeviation && (
                    <FormHelperText fontSize="xs" color="orange.500">
                      Required — deviation from ML must be justified before submission.
                    </FormHelperText>
                  )}
                </FormControl>
              </>
            ) : (
              /* Read-only state for non-PENDING items */
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.500" mb="10px"
                  textTransform="uppercase" letterSpacing="wider">
                  Final Decision
                </Text>
                <Flex gap="12px" mb="12px" flexWrap="wrap">
                  <Box>
                    <Text fontSize="10px" color="gray.500" mb="3px">Action</Text>
                    <ActionBadge action={rec.recommendedAction === "TRIM/HOLD" ? "TRIM" : rec.recommendedAction} />
                  </Box>
                  {rec.amount > 0 && (
                    <Box>
                      <Text fontSize="10px" color="gray.500" mb="3px">Amount</Text>
                      <Text fontSize="sm" fontWeight="700">{formatINR(rec.amount)}</Text>
                    </Box>
                  )}
                  {rec.qty > 0 && (
                    <Box>
                      <Text fontSize="10px" color="gray.500" mb="3px">Qty</Text>
                      <Text fontSize="sm" fontWeight="700">{rec.qty?.toLocaleString("en-IN")}</Text>
                    </Box>
                  )}
                </Flex>
                {rec.modification && (
                  <Box bg={bgCard} borderRadius="md" p="12px" mb="12px">
                    <Text fontSize="xs" fontWeight="700" color="orange.400" mb="6px"
                      textTransform="uppercase" letterSpacing="wider">
                      L1 Modification
                    </Text>
                    <Text fontSize="sm" color={textColor} lineHeight="1.6">
                      {rec.modification.rationale}
                    </Text>
                    <Text fontSize="10px" color="gray.500" mt="4px">
                      — {rec.modification.modifiedBy}
                    </Text>
                  </Box>
                )}
                {rec.status === "REJECTED" && rec.rejectionReason && (
                  <Alert status="error" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    {rec.rejectionReason}
                  </Alert>
                )}
              </Box>
            )}
            </Box>{/* end inner p="20px" box */}
          </Box>
        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter borderTop="1px solid" borderColor="gray.200" gap="8px" flexWrap="wrap">
          <Button size="sm" variant="ghost" onClick={onClose} mr="auto">
            Close
          </Button>
          {isPending && (
            <Button size="sm" colorScheme="green" leftIcon={<MdSave />}
              onClick={handleSaveDraft}>
              Save
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
