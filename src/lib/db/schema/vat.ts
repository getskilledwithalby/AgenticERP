import {
  pgTable,
  uuid,
  date,
  text,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { fiscalYears } from "./fiscal-years";

export const vatPeriods = pgTable("vat_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  fiscalYearId: uuid("fiscal_year_id")
    .references(() => fiscalYears.id)
    .notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  status: text("status").default("open").notNull(),
  outputVat: decimal("output_vat", { precision: 15, scale: 2 }),
  inputVat: decimal("input_vat", { precision: 15, scale: 2 }),
  netVat: decimal("net_vat", { precision: 15, scale: 2 }),
  filedAt: timestamp("filed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
