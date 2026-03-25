import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../schema";
import { basKontoplan } from "./bas-kontoplan";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...\n");

  // 1. Create seed company
  const [company] = await db
    .insert(schema.companies)
    .values({
      name: "Demo AB",
      orgNumber: "556123-4567",
      vatNumber: "SE556123456701",
      address: {
        street: "Storgatan 1",
        postalCode: "111 22",
        city: "Stockholm",
        country: "SE",
      },
      vatPeriodType: "quarterly",
    })
    .returning();

  console.log(`Created company: ${company.name} (${company.orgNumber})`);

  // 2. Create fiscal year 2026
  const [fiscalYear] = await db
    .insert(schema.fiscalYears)
    .values({
      companyId: company.id,
      name: "2026",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })
    .returning();

  console.log(`Created fiscal year: ${fiscalYear.name}`);

  // 3. Seed BAS kontoplan
  const accountValues = basKontoplan.map((account) => ({
    companyId: company.id,
    accountNumber: account.accountNumber,
    name: account.name,
    nameEn: account.nameEn,
    accountClass: parseInt(account.accountNumber[0]),
    vatCode: account.vatCode as "25" | "12" | "6" | "0" | undefined,
  }));

  await db.insert(schema.accounts).values(accountValues);

  console.log(`Seeded ${accountValues.length} BAS accounts`);

  // 4. Create VAT periods for 2026 (quarterly)
  const quarters = [
    { start: "2026-01-01", end: "2026-03-31" },
    { start: "2026-04-01", end: "2026-06-30" },
    { start: "2026-07-01", end: "2026-09-30" },
    { start: "2026-10-01", end: "2026-12-31" },
  ];

  for (const q of quarters) {
    await db.insert(schema.vatPeriods).values({
      companyId: company.id,
      fiscalYearId: fiscalYear.id,
      periodStart: q.start,
      periodEnd: q.end,
    });
  }

  console.log("Created 4 VAT periods (quarterly)");

  // 5. Audit log the seed
  await db.insert(schema.auditLog).values({
    companyId: company.id,
    entityType: "company",
    entityId: company.id,
    action: "create",
    actor: "system",
    changes: { event: "initial_seed", accounts: accountValues.length },
  });

  console.log("\nSeed complete!");
  console.log(`  Company ID: ${company.id}`);
  console.log(`  Fiscal Year ID: ${fiscalYear.id}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
