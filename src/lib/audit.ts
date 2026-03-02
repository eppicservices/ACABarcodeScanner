import prisma from '@/lib/prisma'

interface AuditEntry {
  action: string
  actor: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

export function logAudit(entry: AuditEntry): void {
  // Fire-and-forget: never breaks caller
  prisma.auditLog
    .create({
      data: {
        action: entry.action,
        actor: entry.actor,
        targetId: entry.targetId,
        details: entry.details ?? undefined,
        ipAddress: entry.ipAddress,
      },
    })
    .catch((err) => {
      console.error('Audit log failed:', err)
    })
}
