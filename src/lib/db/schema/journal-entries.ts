import {
  pgTable,
  uuid,
  text,
  varchar,
  date,
  integer,
  decimal,
  smallint,
  timestamp,
  jsonb,
  index,
  check,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { fiscalYears } from "./fiscal-years";
import { accounts } from "./accounts";
import { journalEntryStatus, vatRateEnum } from "./enums";

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    fiscalYearId: uuid("fiscal_year_id")
      .references(() => fiscalYears.id)
      .notNull(),
    verificationNumber: integer("verification_number"),
    verificationSeries: varchar("verification_series", { length: 1 })
      .default("A")
      .notNull(),
    date: date("date").notNull(),
    description: text("description").notNull(),
    status: journalEntryStatus("status").default("draft").notNull(),
    source: text("source").default("manual").notNull(),
    createdBy: text("created_by").default("system").notNull(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
    postedAt: timestamp("posted_at"),
    agentReasoning: jsonb("agent_reasoning").$type<{
      confidence?: string;
      reasoning?: string;
      references?: Array<{ title: string; url: string }>;
      warnings?: string[];
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_je_company_status").on(table.companyId, table.status),
    index("idx_je_company_fy_date").on(
      table.companyId,
      table.fiscalYearId,
      table.date
    ),
    unique("uq_je_company_series_number").on(
      table.companyId,
      table.verificationSeries,
      table.verificationNumber
    ),
  ]
);

export const journalEntryRows = pgTable(
  "journal_entry_rows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    journalEntryId: uuid("journal_entry_id")
      .references(() => journalEntries.id, { onDelete: "cascade" })
      .notNull(),
    accountId: uuid("account_id")
      .references(() => accounts.id)
      .notNull(),
    debit: decimal("debit", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    credit: decimal("credit", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    description: text("description"),
    vatRate: vatRateEnum("vat_rate"),
    vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }),
    costCenter: varchar("cost_center", { length: 20 }),
    project: varchar("project", { length: 20 }),
    sortOrder: smallint("sort_order").default(0).notNull(),
  },
  (table) => [
    index("idx_je_rows_entry").on(table.journalEntryId),
    index("idx_je_rows_account").on(table.accountId),
    check(
      "chk_debit_credit_exclusive",
      sql`NOT (${table.debit} > 0 AND ${table.credit} > 0)`
    ),
  ]
);
