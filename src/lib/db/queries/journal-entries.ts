import { db } from "@/lib/db";
import {
  journalEntries,
  journalEntryRows,
  accounts,
} from "@/lib/db/schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";

export type JournalEntryStatus =
  | "draft"
  | "pending_approval"
  | "posted"
  | "rejected";

export interface JournalEntryFilters {
  companyId: string;
  status?: JournalEntryStatus;
  fiscalYearId?: string;
  limit?: number;
  offset?: number;
}

export async function getJournalEntries(filters: JournalEntryFilters) {
  const conditions = [eq(journalEntries.companyId, filters.companyId)];

  if (filters.status) {
    conditions.push(eq(journalEntries.status, filters.status));
  }
  if (filters.fiscalYearId) {
    conditions.push(eq(journalEntries.fiscalYearId, filters.fiscalYearId));
  }

  const entries = await db
    .select()
    .from(journalEntries)
    .where(and(...conditions))
    .orderBy(desc(journalEntries.date), desc(journalEntries.verificationNumber))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0);

  return entries;
}

export async function getJournalEntryWithRows(entryId: string) {
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, entryId))
    .limit(1);

  if (!entry) return null;

  const rows = await db
    .select({
      id: journalEntryRows.id,
      accountId: journalEntryRows.accountId,
      accountNumber: accounts.accountNumber,
      accountName: accounts.name,
      debit: journalEntryRows.debit,
      credit: journalEntryRows.credit,
      description: journalEntryRows.description,
      vatRate: journalEntryRows.vatRate,
      vatAmount: journalEntryRows.vatAmount,
      sortOrder: journalEntryRows.sortOrder,
    })
    .from(journalEntryRows)
    .innerJoin(accounts, eq(journalEntryRows.accountId, accounts.id))
    .where(eq(journalEntryRows.journalEntryId, entryId))
    .orderBy(asc(journalEntryRows.sortOrder));

  return { ...entry, rows };
}

export async function getJournalEntryCount(
  companyId: string,
  status?: JournalEntryStatus
) {
  const conditions = [eq(journalEntries.companyId, companyId)];
  if (status) conditions.push(eq(journalEntries.status, status));

  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(journalEntries)
    .where(and(...conditions));

  return result.count;
}

export async function getRecentJournalEntries(
  companyId: string,
  limit = 10
) {
  return db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.companyId, companyId),
        eq(journalEntries.status, "posted")
      )
    )
    .orderBy(desc(journalEntries.postedAt))
    .limit(limit);
}

export async function getLedgerForAccount(
  companyId: string,
  accountId: string,
  fromDate?: string,
  toDate?: string
) {
  const conditions = [
    eq(journalEntryRows.accountId, accountId),
    eq(journalEntries.companyId, companyId),
    eq(journalEntries.status, "posted"),
  ];

  if (fromDate) {
    conditions.push(sql`${journalEntries.date} >= ${fromDate}`);
  }
  if (toDate) {
    conditions.push(sql`${journalEntries.date} <= ${toDate}`);
  }

  return db
    .select({
      date: journalEntries.date,
      verificationNumber: journalEntries.verificationNumber,
      verificationSeries: journalEntries.verificationSeries,
      entryDescription: journalEntries.description,
      rowDescription: journalEntryRows.description,
      debit: journalEntryRows.debit,
      credit: journalEntryRows.credit,
      journalEntryId: journalEntries.id,
    })
    .from(journalEntryRows)
    .innerJoin(
      journalEntries,
      eq(journalEntryRows.journalEntryId, journalEntries.id)
    )
    .where(and(...conditions))
    .orderBy(asc(journalEntries.date), asc(journalEntries.verificationNumber));
}
