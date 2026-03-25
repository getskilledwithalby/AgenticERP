import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function insertAuditLog(
  companyId: string,
  entityType: string,
  entityId: string,
  action: "create" | "update" | "approve" | "reject" | "post" | "import" | "export" | "delete",
  actor: string,
  changes?: Record<string, unknown>
) {
  await db.insert(auditLog).values({
    companyId,
    entityType,
    entityId,
    action,
    actor,
    changes,
  });
}

export async function getAuditLogForEntity(
  entityType: string,
  entityId: string
) {
  return db
    .select()
    .from(auditLog)
    .where(
      and(eq(auditLog.entityType, entityType), eq(auditLog.entityId, entityId))
    )
    .orderBy(desc(auditLog.timestamp));
}
