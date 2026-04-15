import {
  Box, Tabs, TabList, Tab, TabPanels, TabPanel,
  Alert, AlertIcon,
} from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecommendations } from "contexts/RecommendationsContext";

import { mockUsers } from "views/admin/research-dashboard/variables/mockData";
import { portfolioData } from "views/admin/research-dashboard/variables/mockPortfolioData";
import { mockSellSchedule, mockBuySchedule } from "views/admin/research-dashboard/variables/mockScheduleData";
import {
  surbhiRecommendations, surbhiAllocation, surbhiIdealCash, surbhiMandateDetail,
} from "views/admin/research-dashboard/variables/mockSurbhiData";

import UserDetailHeader       from "./components/UserDetailHeader";
import MandateAllocationCard  from "./components/MandateAllocationCard";
import InvestmentMandateCard  from "./components/InvestmentMandateCard";
import IdealCashCard          from "./components/IdealCashCard";
import TransactionHistoryTabs from "./components/TransactionHistoryTabs";
import RecommendationsTable   from "views/admin/research-dashboard/components/RecommendationsTable";
import SellScheduleTable      from "views/admin/research-dashboard/components/SellScheduleTable";
import BuyScheduleTable       from "views/admin/research-dashboard/components/BuyScheduleTable";

export default function UserDetailPage() {
  const { userId }  = useParams();
  const navigate    = useNavigate();
  const { recommendations: contextRecs } = useRecommendations();

  const user      = mockUsers.find((u) => u.id === userId);
  const portfolio = portfolioData[userId];

  const handleBack = useCallback(
    () => navigate("/admin/rebalance"),
    [navigate]
  );

  if (!user || !portfolio) {
    return (
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Client not found: {userId}
        </Alert>
      </Box>
    );
  }

  const isInteractive   = userId === "user-001" || userId === "user-002";

  // user-001 uses context recs, user-002 uses Surbhi's custom data, others use generated
  let recommendations, sellSchedule, buySchedule, mandateDetail, allocation, idealCash;
  if (userId === "user-001") {
    recommendations = contextRecs;
    sellSchedule    = mockSellSchedule;
    buySchedule     = mockBuySchedule;
    mandateDetail   = portfolio.mandateDetail;
    allocation      = portfolio.allocation;
    idealCash       = portfolio.idealCash;
  } else if (userId === "user-002") {
    recommendations = surbhiRecommendations;
    sellSchedule    = portfolio.sellSchedule;
    buySchedule     = portfolio.buySchedule;
    mandateDetail   = surbhiMandateDetail;
    allocation      = surbhiAllocation;
    idealCash       = surbhiIdealCash;
  } else {
    recommendations = portfolio.recommendations;
    sellSchedule    = portfolio.sellSchedule;
    buySchedule     = portfolio.buySchedule;
    mandateDetail   = portfolio.mandateDetail;
    allocation      = portfolio.allocation;
    idealCash       = portfolio.idealCash;
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Persistent identity bar — always visible above both tabs */}
      <UserDetailHeader user={user} onBack={handleBack} />

      {/* Top-level two-tab layout */}
      <Tabs variant="soft-rounded" colorScheme="brand" isLazy>
        <TabList mb="20px" gap="8px">
          <Tab fontSize="sm" fontWeight="600">User Profile</Tab>
          <Tab fontSize="sm" fontWeight="600">Recommendations</Tab>
        </TabList>

        <TabPanels>
          {/* ── Tab 1: User Profile ── */}
          <TabPanel px="0" pt="0">
            <InvestmentMandateCard mandateDetail={mandateDetail} allocation={allocation} />
            <IdealCashCard cashData={idealCash} />
            <TransactionHistoryTabs data={portfolio.transactionHistory} />
          </TabPanel>

          {/* ── Tab 2: Recommendations (with inner sub-tabs) ── */}
          <TabPanel px="0" pt="0">
            <Tabs variant="line" colorScheme="brand" isLazy>
              <TabList mb="16px" borderBottom="2px solid" borderColor="gray.100">
                <Tab fontSize="sm" fontWeight="500" pb="10px">Recommendations</Tab>
                <Tab fontSize="sm" fontWeight="500" pb="10px">Sell Schedule</Tab>
                <Tab fontSize="sm" fontWeight="500" pb="10px">Buy Schedule</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px="0" pt="0">
                  <MandateAllocationCard
                    mandateDetail={mandateDetail}
                    allocation={allocation}
                  />
                  <RecommendationsTable data={recommendations} readOnly={!isInteractive} />
                </TabPanel>
                <TabPanel px="0" pt="0">
                  <SellScheduleTable data={sellSchedule} />
                </TabPanel>
                <TabPanel px="0" pt="0">
                  <BuyScheduleTable data={buySchedule} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
