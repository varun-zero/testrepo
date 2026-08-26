import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Message from '@/models/Message';
import { requirePermission } from '@/lib/rbac';
import { escapeRegExp } from '@/lib/sanitize';
import { getPagination, paginated, handleRouteError } from '@/server/http';
import type { FilterQuery } from 'mongoose';
import type { IMessage } from '@/models/Message';

export async function GET(req: NextRequest) {
  const guard = await requirePermission('cms:read');
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const pagination = getPagination(searchParams, 25);

    const filter: FilterQuery<IMessage> = {};
    if (search) {
      const re = new RegExp(escapeRegExp(search.slice(0, 200)), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .select('_id name email contact message createdAt')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    return paginated(messages, total, pagination);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
