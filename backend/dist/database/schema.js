"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aumSnapshots = exports.rebalanceActions = exports.portfolios = exports.userReviews = exports.users = exports.actionEnum = exports.reviewStatusEnum = exports.reviewTypeEnum = exports.onboardingStatusEnum = exports.userStatusEnum = exports.riskMandateEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Enums
exports.riskMandateEnum = (0, pg_core_1.pgEnum)("risk_mandate", ["Conservative", "Low", "Moderate", "High", "Aggressive"]);
exports.userStatusEnum = (0, pg_core_1.pgEnum)("user_status", ["active", "inactive"]);
exports.onboardingStatusEnum = (0, pg_core_1.pgEnum)("onboarding_status", ["pending_review", "review_in_progress", "onboarded"]);
exports.reviewTypeEnum = (0, pg_core_1.pgEnum)("review_type", ["new_user_review", "monthly_review"]);
exports.reviewStatusEnum = (0, pg_core_1.pgEnum)("review_status", ["pending", "in_progress", "completed", "spillover"]);
exports.actionEnum = (0, pg_core_1.pgEnum)("rebalance_action", ["BUY", "SELL", "HOLD", "TRIM_HOLD"]);
// Table: users
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    accountId: (0, pg_core_1.varchar)("account_id").unique().notNull(),
    name: (0, pg_core_1.varchar)("name").notNull(),
    email: (0, pg_core_1.varchar)("email").notNull(),
    phone: (0, pg_core_1.varchar)("phone"),
    riskMandate: (0, exports.riskMandateEnum)("risk_mandate").notNull(),
    status: (0, exports.userStatusEnum)("status").notNull().default("active"),
    onboardingStatus: (0, exports.onboardingStatusEnum)("onboarding_status").notNull().default("pending_review"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// Table: user_reviews
exports.userReviews = (0, pg_core_1.pgTable)("user_reviews", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id).notNull(),
    reviewType: (0, exports.reviewTypeEnum)("review_type").notNull(),
    status: (0, exports.reviewStatusEnum)("status").notNull().default("pending"),
    scheduledDate: (0, pg_core_1.date)("scheduled_date").notNull(),
    completedDate: (0, pg_core_1.date)("completed_date"),
    assignedTo: (0, pg_core_1.varchar)("assigned_to"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Table: portfolios
exports.portfolios = (0, pg_core_1.pgTable)("portfolios", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id).notNull(),
    fundName: (0, pg_core_1.varchar)("fund_name").notNull(),
    isin: (0, pg_core_1.varchar)("isin").notNull(),
    category: (0, pg_core_1.varchar)("category").notNull(),
    assetClass: (0, pg_core_1.varchar)("asset_class").notNull(),
    rating: (0, pg_core_1.integer)("rating").notNull(),
    currentValue: (0, pg_core_1.decimal)("current_value").notNull(),
    availableUnits: (0, pg_core_1.decimal)("available_units").notNull(),
    shortTermUnits: (0, pg_core_1.decimal)("short_term_units").notNull(),
    longTermUnits: (0, pg_core_1.decimal)("long_term_units").notNull(),
    shortTermGains: (0, pg_core_1.decimal)("short_term_gains").notNull(),
    longTermGains: (0, pg_core_1.decimal)("long_term_gains").notNull(),
    taxPayable: (0, pg_core_1.decimal)("tax_payable").notNull(),
    exitLoadAmount: (0, pg_core_1.decimal)("exit_load_amount").notNull(),
    unitsUnderExitLoad: (0, pg_core_1.decimal)("units_under_exit_load").notNull(),
    unitsFreeFromExitLoad: (0, pg_core_1.decimal)("units_free_from_exit_load").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// Table: rebalance_actions
exports.rebalanceActions = (0, pg_core_1.pgTable)("rebalance_actions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id).notNull(),
    portfolioId: (0, pg_core_1.uuid)("portfolio_id").references(() => exports.portfolios.id).notNull(),
    isin: (0, pg_core_1.varchar)("isin").notNull(),
    fundName: (0, pg_core_1.varchar)("fund_name").notNull(),
    action: (0, exports.actionEnum)("action").notNull(),
    actionReason: (0, pg_core_1.varchar)("action_reason").notNull(),
    sellAmount: (0, pg_core_1.decimal)("sell_amount"),
    buyAmount: (0, pg_core_1.decimal)("buy_amount"),
    estimatedTax: (0, pg_core_1.decimal)("estimated_tax").notNull(),
    estimatedExitDate: (0, pg_core_1.date)("estimated_exit_date"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Table: aum_snapshots
exports.aumSnapshots = (0, pg_core_1.pgTable)("aum_snapshots", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    snapshotDate: (0, pg_core_1.date)("snapshot_date").notNull(),
    totalAum: (0, pg_core_1.decimal)("total_aum").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
