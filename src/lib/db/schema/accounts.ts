import {
  pgTable,
  uuid,
  text,
  varchar,
  smallint,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { vatRateEnum } from "./enums";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    accountNumber: varchar("account_number", { length: 4 }).notNull(),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    accountClass: smallint("account_class").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    vatCode: vatRateEnum("vat_code"),
    sruCode: varchar("sru_code", { length: 10 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.companyId, table.accountNumber)]
);
