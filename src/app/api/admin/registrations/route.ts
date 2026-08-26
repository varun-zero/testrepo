import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import { requirePermission } from '@/lib/rbac';
import { escapeRegExp } from '@/lib/sanitize';
import { getPagination, paginated, handleRouteError } from '@/server/http';
import type { FilterQuery } from 'mongoose';
import type { IRegistration } from '@/models/Registration';

export async function GET(req: NextRequest) {
  const guard = await requirePermission('registration:read');
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const domain = searchParams.get('domain');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const pagination = getPagination(searchParams, 50);

    const filter: FilterQuery<IRegistration> = {};
    if (eventId && eventId !== 'all') {
      if (Types.ObjectId.isValid(eventId)) {
        filter.eventId = new Types.ObjectId(eventId);
      }
    }
    if (domain && domain !== 'all') filter.domain = domain;
    if (status && status !== 'all') filter.status = status;
    if (search && search.trim()) {
      const q = escapeRegExp(search.trim().slice(0, 200));
      filter.$or = [
        { squadName: { $regex: q, $options: 'i' } },
        { 'leader.fullName': { $regex: q, $options: 'i' } },
        { 'leader.email': { $regex: q, $options: 'i' } },
        { 'leader.college': { $regex: q, $options: 'i' } },
        { transactionId: { $regex: q, $options: 'i' } },
      ];
    }

    const [registrations, total] = await Promise.all([
      Registration.find(filter, { paymentScreenshot: 0 })
        .populate('eventId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Registration.countDocuments(filter),
    ]);

    const data = registrations.map((r) => ({ ...r, hasScreenshot: true }));

    return paginated(data, total, pagination);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}


