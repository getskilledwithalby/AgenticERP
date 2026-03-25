import { pgEnum } from "drizzle-orm/pg-core";

export const journalEntryStatus = pgEnum("journal_entry_status", [
  "draft",
  "pending_approval",
  "posted",
  "rejected",
]);

export const vatRateEnum = pgEnum("vat_rate", ["25", "12", "6", "0"]);

export const vatPeriodType = pgEnum("vat_period_type", [
  "monthly",
  "quarterly",
]);

export const documentType = pgEnum("document_type", [
  "invoice_incoming",
  "invoice_outgoing",
  "receipt",
  "bank_statement",
  "other",
]);

export const transactionMatchStatus = pgEnum("transaction_match_status", [
  "unmatched",
  "auto_matched",
  "manually_matched",
  "ignored",
]);

export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "approve",
  "reject",
  "post",
  "import",
  "export",
  "delete",
]);
