import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { addWorkingDays, nextWorkingDay } from "utils/executionDate";

const BseOrderContext = createContext(null);

// ── Seed batches for History tab demo ────────────────────────────────────────
const SEED_BATCHES = [
  {
    batch_id: "BAT-20260410-SELL-789",
    type: "sell",
    created_by: "Ops Team",
    created_at: "2026-04-10T10:30:00Z",
    downloaded_at: "2026-04-10T10:35:00Z",
    response_uploaded_at: "2026-04-11T09:00:00Z",
    status: "processing",
    sub_orders: [
      {
        sub_order_id: "ORD-20260410-001",
        batch_id: "BAT-20260410-SELL-789",
        user_id: "user-001",
        user_name: "Rahul Mehta",
        scheme_name: "Franklin India ELSS Tax Saver",
        scheme_code: "120503",
        units: 42.513,
        amount: 954878,
        type: "sell",
        status: "success",
        bse_ref_no: "BSE20260410001",
        order_date: "2026-04-10",
        t2_date: "2026-04-14",
        is_overdue: false,
        response_data: { file: "bse_response_20260411.csv" },
      },
      {
        sub_order_id: "ORD-20260410-002",
        batch_id: "BAT-20260410-SELL-789",
        user_id: "user-001",
        user_name: "Rahul Mehta",
        scheme_name: "Mirae Asset ELSS Tax Saver",
        scheme_code: "120504",
        units: 18.234,
        amount: 231456,
        type: "trim",
        status: "success",
        bse_ref_no: "BSE20260410002",
        order_date: "2026-04-10",
        t2_date: "2026-04-14",
        is_overdue: false,
        response_data: { file: "bse_response_20260411.csv" },
      },
      {
        sub_order_id: "ORD-20260410-003",
        batch_id: "BAT-20260410-SELL-789",
        user_id: "user-002",
        user_name: "Surbhi Narain",
        scheme_name: "Axis Bluechip Fund",
        scheme_code: "120701",
        units: 28.156,
        amount: 342000,
        type: "sell",
        status: "pending",
        bse_ref_no: null,
        order_date: "2026-04-10",
        t2_date: "2026-04-14", // T+2 from Apr 10 → Apr 14 < today Apr 15 → overdue
        is_overdue: false,      // computed dynamically by batchesWithOverdue
        response_data: null,
      },
    ],
  },
  {
    batch_id: "BAT-20260414-BUY-456",
    type: "buy",
    created_by: "Ops Team",
    created_at: "2026-04-14T11:00:00Z",
    downloaded_at: "2026-04-14T11:05:00Z",
    response_uploaded_at: null,
    status: "pending",
    sub_orders: [
      {
        sub_order_id: "ORD-20260414-001",
        batch_id: "BAT-20260414-BUY-456",
        user_id: "user-001",
        user_name: "Rahul Mehta",
        scheme_name: "HDFC Nifty 50 Index Fund",
        scheme_code: "119598",
        units: 0,
        amount: 500000,
        type: "buy",
        status: "pending",
        bse_ref_no: null,
        order_date: "2026-04-14",
        t2_date: "2026-04-17", // T+2 from Apr 14 → Apr 16 (Wed) > today Apr 15 → not overdue
        is_overdue: false,
        response_data: null,
      },
      {
        sub_order_id: "ORD-20260414-002",
        batch_id: "BAT-20260414-BUY-456",
        user_id: "user-002",
        user_name: "Surbhi Narain",
        scheme_name: "Parag Parikh Flexi Cap Fund",
        scheme_code: "122639",
        units: 0,
        amount: 800000,
        type: "buy",
        status: "pending",
        bse_ref_no: null,
        order_date: "2026-04-14",
        t2_date: "2026-04-17",
        is_overdue: false,
        response_data: null,
      },
    ],
  },
];

function genBatchId(type) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const rand = Math.floor(Math.random() * 900 + 100);
  return `BAT-${stamp}-${type.toUpperCase()}-${rand}`;
}
function genSubOrderId(i) {
  return `ORD-${Date.now()}-${String(i).padStart(3,"0")}`;
}

export function BseOrderProvider({ children }) {
  const [batches, setBatches] = useState(SEED_BATCHES);

  const createBatch = useCallback((type, trades, holidaySet = new Set()) => {
    const now = new Date();
    const batchId = genBatchId(type);
    const orderDate = now.toISOString().slice(0, 10);
    const t2 = addWorkingDays(nextWorkingDay(now, holidaySet), 2, holidaySet)
      .toISOString().slice(0, 10);

    const subOrders = trades.map((t, i) => ({
      sub_order_id: genSubOrderId(i),
      batch_id: batchId,
      user_id: t.userId,
      user_name: t.userName,
      scheme_name: t.assetName,
      scheme_code: t.schemeCode ?? "",
      units: t.qty ?? 0,
      amount: t.amount ?? 0,
      type: t.tradeType,   // "sell" | "buy" | "trim"
      status: "pending",
      bse_ref_no: null,
      order_date: orderDate,
      t2_date: t2,
      is_overdue: false,
      response_data: null,
    }));

    const batch = {
      batch_id: batchId,
      type,                // "sell" | "buy"
      created_by: "Ops Team",
      created_at: now.toISOString(),
      downloaded_at: null,
      response_uploaded_at: null,
      status: "generated",
      sub_orders: subOrders,
    };

    setBatches((prev) => [batch, ...prev]);
    return batch;
  }, []);

  const markDownloaded = useCallback((batchId) => {
    setBatches((prev) => prev.map((b) =>
      b.batch_id === batchId
        ? { ...b, status: "downloaded", downloaded_at: new Date().toISOString() }
        : b
    ));
  }, []);

  const uploadResponse = useCallback((batchId, fileName) => {
    setBatches((prev) => prev.map((b) => {
      if (b.batch_id !== batchId) return b;
      const updatedSubs = b.sub_orders.map((s, i) => ({
        ...s,
        status: "success",
        bse_ref_no: `BSE${Date.now()}${String(i).padStart(4,"0")}`,
        response_data: { file: fileName },
      }));
      return {
        ...b,
        status: "success",
        response_uploaded_at: new Date().toISOString(),
        sub_orders: updatedSubs,
      };
    }));
  }, []);

  // Compute overdue status live
  const batchesWithOverdue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return batches.map((b) => ({
      ...b,
      sub_orders: b.sub_orders.map((s) => ({
        ...s,
        is_overdue: ["pending", "processing"].includes(s.status) && s.t2_date < today,
      })),
    }));
  }, [batches]);

  const value = useMemo(
    () => ({ batches: batchesWithOverdue, createBatch, markDownloaded, uploadResponse }),
    [batchesWithOverdue, createBatch, markDownloaded, uploadResponse]
  );

  return <BseOrderContext.Provider value={value}>{children}</BseOrderContext.Provider>;
}

export function useBseOrders() {
  return useContext(BseOrderContext);
}
