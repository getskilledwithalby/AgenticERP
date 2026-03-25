import {
  pgTable,
  uuid,
  text,
  varchar,
  date,
  decimal,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { journalEntries } from "./journal-entries";
import { transactionMatchStatus } from "./enums";

export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    externalId: text("external_id"),
    date: date("date").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("SEK").notNull(),
    counterpart: text("counterpart"),
    reference: text("reference"),
    description: text("description"),
    bankAccount: varchar("bank_account", { length: 34 }),
    matchStatus: transactionMatchStatus("match_status")
      .default("unmatched")
      .notNull(),
    journalEntryId: uuid("journal_entry_id").references(
      () => journalEntries.id
    ),
    source: text("source").default("manual").notNull(),
    rawData: jsonb("raw_data"),
    importedAt: timestamp("imported_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_bank_tx_company_status").on(table.companyId, table.matchStatus),
    index("idx_bank_tx_company_date").on(table.companyId, table.date),
  ]
);
