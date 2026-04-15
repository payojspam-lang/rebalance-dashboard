import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  Box,
  Text,
  Flex,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useRecommendations } from "contexts/RecommendationsContext";
import ActionBadge from "./ActionBadge";

export default function ModifyModal({ rec, isOpen, onClose }) {
  const { modify } = useRecommendations();
  const toast = useToast();
  const bgCard = useColorModeValue("gray.50", "navy.800");

  const [newAction, setNewAction] = useState(rec?.recommendedAction ?? "HOLD");
  const [newAmount, setNewAmount] = useState(rec?.amount ?? 0);
  const [rationale, setRationale] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const rationaleInvalid = submitted && rationale.trim().length < 20;

  function handleSubmit() {
    setSubmitted(true);
    if (rationale.trim().length < 20) return;

    modify(rec.id, {
      newAction,
      newAmount: Number(newAmount),
      rationale: rationale.trim(),
    });

    toast({
      title: "Modification submitted for L2 review.",
      description: `${rec.assetName} → ${newAction}. Awaiting L2 approval.`,
      status: "info",
      duration: 5000,
      isClosable: true,
      position: "top-right",
    });

    onClose();
  }

  if (!rec) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="md">
          Modify Recommendation
          <Text fontSize="sm" fontWeight="400" color="secondaryGray.600" mt="2px">
            {rec.assetName}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {/* Original values */}
          <Box bg={bgCard} borderRadius="md" p="12px" mb="16px">
            <Text fontSize="xs" color="secondaryGray.500" mb="6px" fontWeight="700" textTransform="uppercase" letterSpacing="wider">
              ML Recommendation
            </Text>
            <Flex gap="12px" align="center">
              <ActionBadge action={rec.recommendedAction} />
              {rec.amount > 0 && (
                <Text fontSize="sm" color="secondaryGray.700">
                  ₹{rec.amount.toLocaleString("en-IN")}
                </Text>
              )}
            </Flex>
          </Box>

          {/* New action */}
          <FormControl mb="14px">
            <FormLabel fontSize="sm">New Action</FormLabel>
            <Select
              size="sm"
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="HOLD">HOLD</option>
              <option value="TRIM/HOLD">TRIM/HOLD</option>
            </Select>
          </FormControl>

          {/* New amount — only relevant when action involves money */}
          {(newAction === "BUY" || newAction === "SELL" || newAction === "TRIM/HOLD") && (
            <FormControl mb="14px">
              <FormLabel fontSize="sm">New Amount (₹)</FormLabel>
              <NumberInput
                size="sm"
                value={newAmount}
                onChange={(val) => setNewAmount(val)}
                min={0}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          )}

          {/* Rationale — required */}
          <FormControl isInvalid={rationaleInvalid}>
            <FormLabel fontSize="sm">Rationale <Text as="span" color="red.400">*</Text></FormLabel>
            <Textarea
              size="sm"
              rows={4}
              placeholder="Explain why you are deviating from the ML recommendation (min. 20 characters)..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
            <FormErrorMessage fontSize="xs">
              Please provide a rationale of at least 20 characters.
            </FormErrorMessage>
          </FormControl>
        </ModalBody>

        <ModalFooter gap="8px">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" colorScheme="blue" onClick={handleSubmit}>
            Submit for L2 Review
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
