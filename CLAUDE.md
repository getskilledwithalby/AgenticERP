@AGENTS.md

# AgenticERP

Agentic accounting system for Swedish SMEs. AI agent acts as an expert redovisningskonsult with human-in-the-loop approval.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- Neon Postgres via Vercel Marketplace + Drizzle ORM
- AI SDK v6 (ToolLoopAgent, useChat, AI Gateway)
- shadcn/ui + Tailwind CSS 4 (dark mode, Geist fonts)
- Vercel Platform (deployment, AI Gateway OIDC)

## Architecture

- `src/lib/db/schema/` — Drizzle schema (9 tables: companies, fiscal_years, accounts, journal_entries, journal_entry_rows, bank_transactions, documents, vat_periods, audit_log)
- `src/lib/db/queries/` — Data access layer (accounts, journal-entries, audit, companies)
- `src/lib/agent/` — AI accounting agent (system prompt, 10 tools)
- `src/lib/sie/` — SIE4 parser and generator
- `src/lib/accounting/` — Validation logic (double-entry balance checks)
- `src/actions/` — Server Actions (journal entry CRUD, SIE import)
- `src/app/(dashboard)/` — Dashboard pages (all under route group)
- `src/app/api/chat/` — Streaming agent chat endpoint
- `src/components/layout/` — Shell components (sidebar, top nav, chat panel)

## Key Conventions

- Swedish accounting: BAS 2026 kontoplan, Bokforingslagen compliance
- Agent NEVER posts directly — always creates drafts for human approval
- All amounts in SEK, swedish locale formatting
- Journal entries must balance (total debit = total credit) before posting
- Posted entries are immutable (Bokforingslagen)
- Audit log is append-only
- No auth in prototype — single seed company (Demo AB)

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run db:push      # Push schema to Neon
npm run db:seed      # Seed BAS kontoplan + demo company
npm run db:studio    # Open Drizzle Studio
npm run build        # Production build
npm run lint         # ESLint
```

## Setup (new clone)

```bash
npm install
vercel link --project agenticerp
vercel env pull                    # Gets DATABASE_URL + OIDC token
npm run db:push
npm run db:seed
npm run dev
```

## AI Agent Tools

The agent (src/lib/agent/tools/index.ts) has these tools:
- askQuestions — structured multi-question form (pauses for user input)
- searchAccounts — search BAS kontoplan
- getAccountBalance — account balance for a period
- getTrialBalance — full saldobalans
- searchJournalEntries — search verifikationer
- createDraftJournalEntry — create balanced entry (always draft)
- classifyTransaction — classify bank transaction to BAS accounts
- generateIncomeStatement — resultatrakning
- generateBalanceSheet — balansrakning
- calculateVAT — momsrapport

## Model

Using `anthropic/claude-sonnet-4.6` via AI Gateway (OIDC auth). Model string is in `src/lib/agent/index.ts`.
