import { pgTable, uuid, varchar, timestamp, integer, decimal, date, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const riskMandateEnum = pgEnum("risk_mandate", ["Conservative", "Low", "Moderate", "High", "Aggressive"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const onboardingStatusEnum = pgEnum("onboarding_status", ["pending_review", "review_in_progress", "onboarded"]);
export const reviewTypeEnum = pgEnum("review_type", ["new_user_review", "monthly_review"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "in_progress", "completed", "spillover"]);
export const actionEnum = pgEnum("rebalance_action", ["BUY", "SELL", "HOLD", "TRIM_HOLD"]);

// Table: users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: varchar("account_id").unique().notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  riskMandate: riskMandateEnum("risk_mandate").notNull(),
  status: userStatusEnum("status").notNull().default("active"),
  onboardingStatus: onboardingStatusEnum("onboarding_status").notNull().default("pending_review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table: user_reviews
export const userReviews = pgTable("user_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  reviewType: reviewTypeEnum("review_type").notNull(),
  status: reviewStatusEnum("status").notNull().default("pending"),
  scheduledDate: date("scheduled_date").notNull(),
  completedDate: date("completed_date"),
  assignedTo: varchar("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table: portfolios
export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  fundName: varchar("fund_name").notNull(),
  isin: varchar("isin").notNull(),
  category: varchar("category").notNull(),
  assetClass: varchar("asset_class").notNull(),
  rating: integer("rating").notNull(),
  currentValue: decimal("current_value").notNull(),
  availableUnits: decimal("available_units").notNull(),
  shortTermUnits: decimal("short_term_units").notNull(),
  longTermUnits: decimal("long_term_units").notNull(),
  shortTermGains: decimal("short_term_gains").notNull(),
  longTermGains: decimal("long_term_gains").notNull(),
  taxPayable: decimal("tax_payable").notNull(),
  exitLoadAmount: decimal("exit_load_amount").notNull(),
  unitsUnderExitLoad: decimal("units_under_exit_load").notNull(),
  unitsFreeFromExitLoad: decimal("units_free_from_exit_load").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table: rebalance_actions
export const rebalanceActions = pgTable("rebalance_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id).notNull(),
  isin: varchar("isin").notNull(),
  fundName: varchar("fund_name").notNull(),
  action: actionEnum("action").notNull(),
  actionReason: varchar("action_reason").notNull(),
  sellAmount: decimal("sell_amount"),
  buyAmount: decimal("buy_amount"),
  estimatedTax: decimal("estimated_tax").notNull(),
  estimatedExitDate: date("estimated_exit_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table: aum_snapshots
export const aumSnapshots = pgTable("aum_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  snapshotDate: date("snapshot_date").notNull(),
  totalAum: decimal("total_aum").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
