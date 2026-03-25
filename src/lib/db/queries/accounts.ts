import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and, asc, like, sql } from "drizzle-orm";
import { journalEntryRows, journalEntries } from "@/lib/db/schema";

export async function getAccounts(companyId: string) {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.companyId, companyId), eq(accounts.isActive, true)))
    .orderBy(asc(accounts.accountNumber));
}

export async function getAccountsByClass(companyId: string) {
  const allAccounts = await getAccounts(companyId);

  const grouped = new Map<number, typeof allAccounts>();
  for (const account of allAccounts) {
    const cls = account.accountClass;
    if (!grouped.has(cls)) grouped.set(cls, []);
    grouped.get(cls)!.push(account);
  }

  return grouped;
}

export async function getAccountByNumber(
  companyId: string,
  accountNumber: string
) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.companyId, companyId),
        eq(accounts.accountNumber, accountNumber)
      )
    )
    .limit(1);

  return account ?? null;
}

export async function searchAccounts(companyId: string, query: string) {
  return db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.companyId, companyId),
        eq(accounts.isActive, true),
        sql`(${accounts.accountNumber} LIKE ${`%${query}%`} OR LOWER(${accounts.name}) LIKE ${`%${query.toLowerCase()}%`})`
      )
    )
    .orderBy(asc(accounts.accountNumber))
    .limit(50);
}

export async function getAccountBalance(
  companyId: string,
  accountNumber: string,
  fromDate?: string,
  toDate?: string
) {
  const account = await getAccountByNumber(companyId, accountNumber);
  if (!account) return null;

  const conditions = [
    eq(journalEntryRows.accountId, account.id),
    eq(journalEntries.companyId, companyId),
    eq(journalEntries.status, "posted"),
  ];

  if (fromDate) {
    conditions.push(sql`${journalEntries.date} >= ${fromDate}`);
  }
  if (toDate) {
    conditions.push(sql`${journalEntries.date} <= ${toDate}`);
  }

  const [result] = await db
    .select({
      totalDebit: sql<string>`COALESCE(SUM(${journalEntryRows.debit}), 0)`,
      totalCredit: sql<string>`COALESCE(SUM(${journalEntryRows.credit}), 0)`,
    })
    .from(journalEntryRows)
    .innerJoin(
      journalEntries,
      eq(journalEntryRows.journalEntryId, journalEntries.id)
    )
    .where(and(...conditions));

  const debit = parseFloat(result.totalDebit);
  const credit = parseFloat(result.totalCredit);

  return {
    accountNumber,
    accountName: account.name,
    debit,
    credit,
    balance: debit - credit,
  };
}
