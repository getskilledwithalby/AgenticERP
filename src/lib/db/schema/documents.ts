import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { journalEntries } from "./journal-entries";
import { documentType } from "./enums";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  type: documentType("type").default("other").notNull(),
  filename: text("filename").notNull(),
  blobUrl: text("blob_url").notNull(),
  blobPathname: text("blob_pathname").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  extractedData: jsonb("extracted_data"),
  extractionStatus: text("extraction_status").default("pending").notNull(),
  journalEntryId: uuid("journal_entry_id").references(
    () => journalEntries.id
  ),
  uploadedBy: text("uploaded_by").default("system").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
