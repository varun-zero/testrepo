import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';
import Registration from '@/models/Registration';
import EventModel from '@/models/EventModel';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 registrations per 10 minutes per IP
    const limited = await rateLimit(req, { name: 'register', limit: 5, windowMs: 10 * 60 * 1000 });
    if (limited) return limited;

    await connectToDatabase();

    const rawFormData = await req.formData();
    const eventId = rawFormData.get('eventId') as string | null;

    let requiresPayment = false;
    let eventTitle = 'Event';
    let eventFound = false;

    if (eventId && Types.ObjectId.isValid(eventId)) {
      const ev = await EventModel.findById(eventId).lean();
      if (ev) {
        eventFound = true;
        eventTitle = ev.title;
        requiresPayment = ev.registration?.requiresPayment ?? ((ev.registration?.fee ?? 0) > 0);
      }
    }

    if (!eventFound) {
      return NextResponse.json({ error: 'A valid event reference is required' }, { status: 400 });
    }

    // Collect submitted text entries into a customData dictionary
    // (non-string values such as stray files are ignored)
    const customData: Record<string, unknown> = {};
    for (const [key, value] of rawFormData.entries()) {
      if (typeof value === 'string') {
        customData[key] = sanitizeText(value);
      }
    }

    // Helper to retrieve value matching various candidate keys
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        const v = rawFormData.get(k);
        if (typeof v === 'string' && v.trim()) return sanitizeText(v.trim());
      }
      return '';
    };

    const squadName = getVal('squadName', 'squad_name', 'squad', 'teamName', 'team_name', 'name', 'title') || 'Squad';
    const domain = getVal('domain', 'category', 'path') || 'General';
    const leaderFullName = getVal('leaderFullName', 'leader_name', 'fullName', 'full_name', 'name') || 'Participant';
    const rawLeaderEmail = getVal('leaderEmail', 'leader_email', 'email', 'email_address', 'emailid', 'email_id', 'contact_email', 'user_email', 'mail');
    if (rawLeaderEmail) {
      const emailCheck = z.string().trim().email().max(320).safeParse(rawLeaderEmail);
      if (!emailCheck.success) {
        return NextResponse.json({ error: 'A valid leader email is required' }, { status: 400 });
      }
    }
    const leaderEmail = rawLeaderEmail ? sanitizeEmail(rawLeaderEmail) : 'no-email@registration.local';
    const leaderPhone = getVal('leaderPhone', 'leader_phone', 'phone', 'contact', 'mobile') || 'N/A';
    const leaderCollege = getVal('leaderCollege', 'leader_college', 'college', 'institute') || 'N/A';
    const transactionId = getVal('transactionId', 'transaction_id', 'txId', 'tx_id') || (requiresPayment ? '' : 'FREE-REGISTRATION');

    if (requiresPayment && !transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required for paid registrations' }, { status: 400 });
    }

    // Duplicate-payment guard: the same transaction/UPI reference cannot be
    // reused for a second registration in the same event (also enforced by a
    // unique sparse index on transactionKey).
    let transactionKey: string | undefined;
    if (requiresPayment && eventId && transactionId) {
      transactionKey = `${eventId}:${transactionId.toLowerCase().trim()}`;
      const duplicate = await Registration.findOne({ transactionKey }).lean();
      if (duplicate) {
        return NextResponse.json(
          { error: 'This transaction ID has already been used for a registration.' },
          { status: 409 }
        );
      }
    }

    // Handle payment screenshot file
    let paymentScreenshot = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    let file = (rawFormData.get('paymentScreenshot') || rawFormData.get('payment_screenshot')) as File | null;
    if (!file) {
      for (const [k, v] of rawFormData.entries()) {
        if (v instanceof File && v.size > 0 && (k.toLowerCase().includes('screenshot') || k.toLowerCase().includes('payment'))) {
          file = v;
          break;
        }
      }
    }
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Payment screenshot must be under 5MB' }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mimeType = file.type || 'image/jpeg';
      paymentScreenshot = `data:${mimeType};base64,${base64}`;
    } else if (requiresPayment) {
      return NextResponse.json({ error: 'Payment screenshot is required for paid registrations' }, { status: 400 });
    }

    // Parse team members if present
    const members = [];
    for (let i = 2; i <= 10; i++) {
      const memberName = getVal(`member${i}FullName`, `member_${i}_name`);
      const rawMemberEmail = getVal(`member${i}Email`, `member_${i}_email`);
      const memberEmail = rawMemberEmail ? sanitizeEmail(rawMemberEmail) : '';
      if (memberName || memberEmail) {
        members.push({ fullName: memberName || `Member ${i}`, email: memberEmail });
      }
    }

    // Save registration document
    const newRegistration = new Registration({
      eventId: new Types.ObjectId(eventId as string),
      squadName,
      domain,
      leader: {
        fullName: leaderFullName,
        email: leaderEmail,
        phone: leaderPhone,
        college: leaderCollege,
      },
      members,
      transactionId,
      ...(transactionKey ? { transactionKey } : {}),
      paymentScreenshot,
      formData: customData,
      status: 'pending',
    });

    await newRegistration.save();

    // Send confirmation email to applicant
    if (leaderEmail && leaderEmail !== 'no-email@registration.local') {
      try {
        const { sendRegistrationSubmissionEmail } = await import('@/lib/email');
        await sendRegistrationSubmissionEmail({
          email: leaderEmail,
          name: leaderFullName,
          squadName,
          eventTitle,
        });
      } catch (e) {
        console.error('[Registration API] Failed to send submission email:', e);
      }
    }

    return NextResponse.json({ success: true, message: `Registration for ${eventTitle} successful!` }, { status: 201 });
  } catch (error: unknown) {
    console.error('Registration API Error:', error);
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: 'This transaction ID has already been used for a registration.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
