import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { mockRecommendations } from "views/admin/research-dashboard/variables/mockData";

const RecommendationsContext = createContext(null);

// Deviation threshold: if amount or qty changes by more than this %, it's a deviation requiring L2.
const DEVIATION_THRESHOLD_PCT = 5;

function hasDeviation(original, edit) {
  if (edit.action !== original.mlAction) return true;
  if (original.mlAmount > 0 && edit.amount !== undefined) {
    const pctDiff = Math.abs((edit.amount - original.mlAmount) / original.mlAmount) * 100;
    if (pctDiff > DEVIATION_THRESHOLD_PCT) return true;
  }
  if (original.mlQty > 0 && edit.qty !== undefined) {
    const pctDiff = Math.abs((edit.qty - original.mlQty) / original.mlQty) * 100;
    if (pctDiff > DEVIATION_THRESHOLD_PCT) return true;
  }
  return false;
}

export function RecommendationsProvider({ children }) {
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  // Request-level status: DRAFT | PENDING_REVIEW | L2_REVIEW | APPROVED | REJECTED | IN_PROGRESS | COMPLETED
  const [requestStatus, setRequestStatus] = useState("PENDING_REVIEW");

  const approve = useCallback((id) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "APPROVED", updatedAt: new Date().toISOString() } : r
      )
    );
  }, []);

  const modify = useCallback((id, { newAction, newAmount, newQty, rationale }) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "L2_PENDING",
              recommendedAction: newAction,
              amount: newAmount ?? r.amount,
              qty: newQty ?? r.qty,
              modification: {
                originalAction: r.mlAction,
                originalAmount: r.mlAmount,
                originalQty: r.mlQty,
                newAction,
                newAmount: newAmount ?? r.mlAmount,
                newQty: newQty ?? r.mlQty,
                rationale,
                modifiedBy: "Priya Sharma",
                modifiedByRole: "L1",
                createdAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  }, []);

  // Save edits as draft — persists analyst changes without submitting
  const saveDraft = useCallback((edits) => {
    setRecommendations((prev) =>
      prev.map((r) => {
        const edit = edits[r.id];
        if (!edit || r.status !== "PENDING") return r;
        return {
          ...r,
          recommendedAction: edit.action ?? r.recommendedAction,
          amount: edit.amount ?? r.amount,
          qty: edit.qty ?? r.qty,
          draftNotes: edit.notes ?? r.draftNotes,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setRequestStatus("DRAFT");
  }, []);

  // Submit request — changed items go to L2, unchanged items are approved
  const submitRequest = useCallback((edits) => {
    let anyDeviation = false;
    setRecommendations((prev) =>
      prev.map((r) => {
        if (r.status !== "PENDING") return r;
        const edit = edits[r.id] || {};
        const action = edit.action ?? r.mlAction;
        const amount = edit.amount ?? r.mlAmount;
        const qty = edit.qty ?? r.mlQty;
        const notes = (edit.notes ?? "").trim();
        const deviated = hasDeviation(r, { action, amount, qty });

        if (deviated) {
          anyDeviation = true;
          return {
            ...r,
            status: "L2_PENDING",
            recommendedAction: action,
            amount,
            qty,
            modification: {
              originalAction: r.mlAction,
              originalAmount: r.mlAmount,
              originalQty: r.mlQty,
              newAction: action,
              newAmount: amount,
              newQty: qty,
              rationale: notes || "Modified via batch review.",
              modifiedBy: "Priya Sharma",
              modifiedByRole: "L1",
              createdAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return {
          ...r,
          status: "APPROVED",
          recommendedAction: action,
          amount,
          qty,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setRequestStatus(anyDeviation ? "L2_REVIEW" : "APPROVED");
  }, []);

  // Explicitly submit all pending items for L2 review
  const submitForReview = useCallback((edits) => {
    setRecommendations((prev) =>
      prev.map((r) => {
        if (r.status !== "PENDING") return r;
        const edit = edits[r.id] || {};
        const action = edit.action ?? r.mlAction;
        const amount = edit.amount ?? r.mlAmount;
        const qty = edit.qty ?? r.mlQty;
        const notes = (edit.notes ?? "").trim();
        return {
          ...r,
          status: "L2_PENDING",
          recommendedAction: action,
          amount,
          qty,
          modification: {
            originalAction: r.mlAction,
            originalAmount: r.mlAmount,
            originalQty: r.mlQty,
            newAction: action,
            newAmount: amount,
            newQty: qty,
            rationale: notes || "Submitted for L2 review.",
            modifiedBy: "Priya Sharma",
            modifiedByRole: "L1",
            createdAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setRequestStatus("L2_REVIEW");
  }, []);

  const l2Approve = useCallback((id, comment) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "APPROVED",
              recommendedAction: r.modification?.newAction ?? r.recommendedAction,
              amount: r.modification?.newAmount ?? r.amount,
              qty: r.modification?.newQty ?? r.qty,
              l2Comment: comment,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  }, []);

  const l2Reject = useCallback((id, reason) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "REJECTED",
              rejectionReason: reason,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  }, []);

  // Ops: move all APPROVED → IN_PROGRESS
  const startBatch = useCallback(() => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.status === "APPROVED"
          ? { ...r, status: "IN_PROGRESS", batchedAt: new Date().toISOString() }
          : r
      )
    );
    setRequestStatus("IN_PROGRESS");
  }, []);

  // Ops: move all IN_PROGRESS → COMPLETED
  const completeBatch = useCallback(() => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.status === "IN_PROGRESS"
          ? { ...r, status: "COMPLETED", completedAt: new Date().toISOString() }
          : r
      )
    );
    setRequestStatus("COMPLETED");
  }, []);

  const value = useMemo(
    () => ({
      recommendations,
      requestStatus,
      approve,
      modify,
      saveDraft,
      submitRequest,
      submitForReview,
      l2Approve,
      l2Reject,
      startBatch,
      completeBatch,
    }),
    [recommendations, requestStatus, approve, modify, saveDraft, submitRequest, submitForReview, l2Approve, l2Reject, startBatch, completeBatch]
  );

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
}

export function useRecommendations() {
  return useContext(RecommendationsContext);
}
