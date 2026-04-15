import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import { mockRecommendations } from "views/admin/research-dashboard/variables/mockData";
import { surbhiRecommendations } from "views/admin/research-dashboard/variables/mockSurbhiData";

const RecommendationsContext = createContext(null);

const DEVIATION_THRESHOLD_PCT = 5;

// Seed all users' recommendations into a single map.
// Add more users here as mock data grows.
const INITIAL_RECS = {
  "user-001": mockRecommendations,
  "user-002": surbhiRecommendations,
};

const INITIAL_STATUSES = {
  "user-001": "PENDING_REVIEW",
  "user-002": "PENDING_REVIEW",
};

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
  const [allUserRecs, setAllUserRecs]       = useState(INITIAL_RECS);
  const [requestStatuses, setRequestStatuses] = useState(INITIAL_STATUSES);
  const [activeUserId, setActiveUserIdState]  = useState("user-001");

  // Ref prevents stale closures inside useCallback functions
  const activeUserIdRef = useRef("user-001");

  const setActiveUser = useCallback((userId) => {
    setActiveUserIdState(userId);
    activeUserIdRef.current = userId;
  }, []);

  // Derived slices for the active user — keeps backward-compat with RecommendationsTable
  const recommendations = useMemo(
    () => allUserRecs[activeUserId] ?? [],
    [allUserRecs, activeUserId],
  );
  const requestStatus = useMemo(
    () => requestStatuses[activeUserId] ?? "PENDING_REVIEW",
    [requestStatuses, activeUserId],
  );

  // ── Internal helpers ────────────────────────────────────────────────────────

  const updateUserRecs = useCallback((userId, updater) => {
    setAllUserRecs((prev) => ({ ...prev, [userId]: updater(prev[userId] ?? []) }));
  }, []);

  const updateUserStatus = useCallback((userId, status) => {
    setRequestStatuses((prev) => ({ ...prev, [userId]: status }));
  }, []);

  // ── Mutation actions (all operate on activeUserId) ──────────────────────────

  const approve = useCallback((id) => {
    const uid = activeUserIdRef.current;
    updateUserRecs(uid, (recs) =>
      recs.map((r) =>
        r.id === id ? { ...r, status: "APPROVED", updatedAt: new Date().toISOString() } : r,
      ),
    );
  }, [updateUserRecs]);

  const modify = useCallback((id, { newAction, newAmount, newQty, rationale }) => {
    const uid = activeUserIdRef.current;
    updateUserRecs(uid, (recs) =>
      recs.map((r) =>
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
          : r,
      ),
    );
  }, [updateUserRecs]);

  const saveDraft = useCallback((edits) => {
    const uid = activeUserIdRef.current;
    updateUserRecs(uid, (recs) =>
      recs.map((r) => {
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
      }),
    );
    updateUserStatus(uid, "DRAFT");
  }, [updateUserRecs, updateUserStatus]);

  const submitRequest = useCallback((edits) => {
    const uid = activeUserIdRef.current;
    let anyDeviation = false;
    updateUserRecs(uid, (recs) =>
      recs.map((r) => {
        if (r.status !== "PENDING") return r;
        const edit   = edits[r.id] || {};
        const action = edit.action ?? r.mlAction;
        const amount = edit.amount ?? r.mlAmount;
        const qty    = edit.qty    ?? r.mlQty;
        const notes  = (edit.notes ?? "").trim();
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
      }),
    );
    updateUserStatus(uid, anyDeviation ? "L2_REVIEW" : "APPROVED");
  }, [updateUserRecs, updateUserStatus]);

  const submitForReview = useCallback((edits) => {
    const uid = activeUserIdRef.current;
    updateUserRecs(uid, (recs) =>
      recs.map((r) => {
        if (r.status !== "PENDING") return r;
        const edit   = edits[r.id] || {};
        const action = edit.action ?? r.mlAction;
        const amount = edit.amount ?? r.mlAmount;
        const qty    = edit.qty    ?? r.mlQty;
        const notes  = (edit.notes ?? "").trim();
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
      }),
    );
    updateUserStatus(uid, "L2_REVIEW");
  }, [updateUserRecs, updateUserStatus]);

  const l2Approve = useCallback((id, comment) => {
    const uid = activeUserIdRef.current;
    updateUserRecs(uid, (recs) =>
      recs.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "APPROVED",
              recommendedAction: r.modification?.newAction ?? r.recommendedAction,
              amount: r.modification?.newAmount ?? r.amount,
              qty:    r.modification?.newQty    ?? r.qty,
              l2Comment: comment,
              updatedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
  }, [updateUserRecs]);

  const l2Reject = useCallback((id, reason) => {
    const uid = activeUserIdRef.current;
    updateUserRecs(uid, (recs) =>
      recs.map((r) =>
        r.id === id
          ? { ...r, status: "REJECTED", rejectionReason: reason, updatedAt: new Date().toISOString() }
          : r,
      ),
    );
  }, [updateUserRecs]);

  // ── Batch operations (span ALL users) ──────────────────────────────────────

  const startBatch = useCallback(() => {
    setAllUserRecs((prev) => {
      const next = {};
      for (const [uid, recs] of Object.entries(prev)) {
        next[uid] = recs.map((r) =>
          r.status === "APPROVED"
            ? { ...r, status: "IN_PROGRESS", batchedAt: new Date().toISOString() }
            : r,
        );
      }
      return next;
    });
    setRequestStatuses((prev) => {
      const next = {};
      for (const [uid, s] of Object.entries(prev)) {
        next[uid] = s === "APPROVED" ? "IN_PROGRESS" : s;
      }
      return next;
    });
  }, []);

  const completeBatch = useCallback(() => {
    setAllUserRecs((prev) => {
      const next = {};
      for (const [uid, recs] of Object.entries(prev)) {
        next[uid] = recs.map((r) =>
          r.status === "IN_PROGRESS"
            ? { ...r, status: "COMPLETED", completedAt: new Date().toISOString() }
            : r,
        );
      }
      return next;
    });
    setRequestStatuses((prev) => {
      const next = {};
      for (const [uid, s] of Object.entries(prev)) {
        next[uid] = s === "IN_PROGRESS" ? "COMPLETED" : s;
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      recommendations,  // active user's recs (backward-compat)
      requestStatus,    // active user's status (backward-compat)
      allUserRecs,      // full map — used by BSE Order File
      activeUserId,
      setActiveUser,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recommendations, requestStatus, allUserRecs, activeUserId],
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
