import { db } from "@/lib/db";
import { companies, fiscalYears } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function getCompany(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  return company ?? null;
}

export async function getFirstCompany() {
  const [company] = await db
    .select()
    .from(companies)
    .limit(1);

  return company ?? null;
}

export async function getActiveFiscalYear(companyId: string) {
  const [fy] = await db
    .select()
    .from(fiscalYears)
    .where(
      and(
        eq(fiscalYears.companyId, companyId),
        eq(fiscalYears.isClosed, false)
      )
    )
    .orderBy(desc(fiscalYears.startDate))
    .limit(1);

  return fy ?? null;
}
