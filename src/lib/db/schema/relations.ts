import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { fiscalYears } from "./fiscal-years";
import { accounts } from "./accounts";
import { journalEntries, journalEntryRows } from "./journal-entries";
import { bankTransactions } from "./bank-transactions";
import { documents } from "./documents";
import { vatPeriods } from "./vat";
import { auditLog } from "./audit-log";

export const companiesRelations = relations(companies, ({ many }) => ({
  fiscalYears: many(fiscalYears),
  accounts: many(accounts),
  journalEntries: many(journalEntries),
  bankTransactions: many(bankTransactions),
  documents: many(documents),
  vatPeriods: many(vatPeriods),
  auditLog: many(auditLog),
}));

export const fiscalYearsRelations = relations(fiscalYears, ({ one, many }) => ({
  company: one(companies, {
    fields: [fiscalYears.companyId],
    references: [companies.id],
  }),
  journalEntries: many(journalEntries),
  vatPeriods: many(vatPeriods),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  journalEntryRows: many(journalEntryRows),
}));

export const journalEntriesRelations = relations(
  journalEntries,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [journalEntries.companyId],
      references: [companies.id],
    }),
    fiscalYear: one(fiscalYears, {
      fields: [journalEntries.fiscalYearId],
      references: [fiscalYears.id],
    }),
    rows: many(journalEntryRows),
    bankTransactions: many(bankTransactions),
    documents: many(documents),
  })
);

export const journalEntryRowsRelations = relations(
  journalEntryRows,
  ({ one }) => ({
    journalEntry: one(journalEntries, {
      fields: [journalEntryRows.journalEntryId],
      references: [journalEntries.id],
    }),
    account: one(accounts, {
      fields: [journalEntryRows.accountId],
      references: [accounts.id],
    }),
  })
);

export const bankTransactionsRelations = relations(
  bankTransactions,
  ({ one }) => ({
    company: one(companies, {
      fields: [bankTransactions.companyId],
      references: [companies.id],
    }),
    journalEntry: one(journalEntries, {
      fields: [bankTransactions.journalEntryId],
      references: [journalEntries.id],
    }),
  })
);

export const documentsRelations = relations(documents, ({ one }) => ({
  company: one(companies, {
    fields: [documents.companyId],
    references: [companies.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [documents.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const vatPeriodsRelations = relations(vatPeriods, ({ one }) => ({
  company: one(companies, {
    fields: [vatPeriods.companyId],
    references: [companies.id],
  }),
  fiscalYear: one(fiscalYears, {
    fields: [vatPeriods.fiscalYearId],
    references: [fiscalYears.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  company: one(companies, {
    fields: [auditLog.companyId],
    references: [companies.id],
  }),
}));
