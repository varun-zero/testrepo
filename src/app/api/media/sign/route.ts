import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/rbac';
import { ok, fail, handleRouteError } from '@/server/http';
import { signUpload } from '@/lib/cloudinary';

// Folders must stay under the nsdc/ root and contain no traversal segments.
const FOLDER_PATTERN = /^nsdc\/[A-Za-z0-9\-_/]{1,100}$/;

// Admin: get a signed payload for a direct-to-Cloudinary upload.
export async function POST(req: NextRequest) {
  const guard = await requirePermission('media:upload');
  if (guard.error) return guard.error;
  try {
    const body = await req.json().catch(() => ({}));
    const requested = typeof body?.folder === 'string' ? body.folder.trim() : '';
    const folder = FOLDER_PATTERN.test(requested) ? requested : 'nsdc/uploads';
    return ok(signUpload(folder));
  } catch (error) {
    if (error instanceof Error && error.message.includes('not configured')) {
      return fail('NOT_CONFIGURED', error.message, 503);
    }
    return handleRouteError(error);
  }
}
