import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/rbac';
import { ok, fail, handleRouteError } from '@/server/http';
import { getSettings, updateSettings } from '@/server/services/settingsService';
import { recordAudit } from '@/server/services/auditService';
import type { Permission } from '@/config/permissions';
import type { SettingsScope } from '@/models/Settings';

const settingsPatchSchema = z.record(
  z.string().min(1).max(100),
  z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])
);

function resolve(scope: string): { scope: SettingsScope; perm: Permission } | null {
  if (scope === 'business') return { scope: 'business', perm: 'settings:business' };
  if (scope === 'technical') return { scope: 'technical', perm: 'settings:technical' };
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ scope: string }> }) {
  const { scope } = await params;
  const r = resolve(scope);
  if (!r) return fail('NOT_FOUND', 'Unknown settings scope', 404);
  const guard = await requirePermission(r.perm);
  if (guard.error) return guard.error;
  try {
    return ok(await getSettings(r.scope));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ scope: string }> }) {
  const { scope } = await params;
  const r = resolve(scope);
  if (!r) return fail('NOT_FOUND', 'Unknown settings scope', 404);
  const guard = await requirePermission(r.perm);
  if (guard.error) return guard.error;
  try {
    const body = await req.json();
    const parsed = settingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return fail('VALIDATION', 'Body must be an object of primitive settings values', 422);
    }
    const updated = await updateSettings(r.scope, parsed.data, guard.ctx.userId);
    await recordAudit({
      actorId: guard.ctx.userId,
      actorRole: guard.ctx.role,
      action: `settings.${r.scope}.update`,
      resource: { type: 'settings', id: r.scope },
    });
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
