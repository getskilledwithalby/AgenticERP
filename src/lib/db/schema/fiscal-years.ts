import { pgTable, uuid, text, date, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const fiscalYears = pgTable(
  "fiscal_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    name: text("name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    isClosed: boolean("is_closed").default(false).notNull(),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.companyId, table.startDate)]
);
