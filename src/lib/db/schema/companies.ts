import { pgTable, uuid, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { vatPeriodType } from "./enums";

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  orgNumber: varchar("org_number", { length: 11 }),
  vatNumber: varchar("vat_number", { length: 20 }),
  address: jsonb("address").$type<{
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  }>(),
  vatPeriodType: vatPeriodType("vat_period_type").default("quarterly"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
