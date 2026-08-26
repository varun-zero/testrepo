import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import EventModel from '@/models/EventModel';
import type { IFormField } from '@/models/FormSchema';
import { requirePermission } from '@/lib/rbac';
import { handleRouteError } from '@/server/http';
import ExcelJS from 'exceljs';

interface RegistrationDoc {
  _id: string;
  eventId?: { _id: string; title: string; slug: string; registration?: { formSchemaId?: Types.ObjectId } };
  squadName: string;
  domain: string;
  leader: { fullName: string; email: string; phone: string; college: string };
  members: { fullName: string; email: string }[];
  transactionId: string;
  paymentScreenshot?: string;
  formData?: Record<string, unknown>;
  status: string;
  createdAt: Date;
}

function getFieldValue(r: RegistrationDoc, fieldKey: string, fieldLabel: string): unknown {
  const formData = r.formData || {};

  // 1. Direct key match in formData
  if (formData[fieldKey] !== undefined && formData[fieldKey] !== null && formData[fieldKey] !== '') {
    return formData[fieldKey];
  }

  const normKey = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normLabel = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 2. Case-insensitive & symbol-insensitive match in formData
  for (const [k, v] of Object.entries(formData)) {
    const nk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (v !== undefined && v !== null && v !== '' && (nk === normKey || nk === normLabel)) {
      return v;
    }
  }

  // 3. Fallbacks for standard Registration top-level properties
  if (normKey.includes('squad') || normKey.includes('teamname')) {
    if (r.squadName && r.squadName !== 'Squad') return r.squadName;
    if (formData.squadName || formData.squad_name) return formData.squadName || formData.squad_name;
  }

  if (normKey.includes('domain') || normKey.includes('category')) {
    if (r.domain) return r.domain;
  }

  // Member 1 / Leader fallbacks
  if (
    normKey.includes('leader') ||
    normKey.includes('member1') ||
    normKey.includes('member_1')
  ) {
    if (normKey.includes('email')) {
      if (r.leader?.email && r.leader.email !== 'no-email@registration.local') return r.leader.email;
    }
    if (normKey.includes('phone') || normKey.includes('contact') || normKey.includes('mobile')) {
      if (r.leader?.phone && r.leader.phone !== 'N/A') return r.leader.phone;
    }
    if (normKey.includes('college') || normKey.includes('institute')) {
      if (r.leader?.college && r.leader.college !== 'N/A') return r.leader.college;
    }
    if (normKey.includes('name') || normKey.includes('full')) {
      if (r.leader?.fullName && r.leader.fullName !== 'Participant') return r.leader.fullName;
    }
  }

  // Member 2 fallbacks
  if (normKey.includes('member2') || normKey.includes('member_2')) {
    if (normKey.includes('email') && r.members?.[0]?.email) return r.members[0].email;
    if (normKey.includes('name') && r.members?.[0]?.fullName) return r.members[0].fullName;
  }

  // Member 3 fallbacks
  if (normKey.includes('member3') || normKey.includes('member_3')) {
    if (normKey.includes('email') && r.members?.[1]?.email) return r.members[1].email;
    if (normKey.includes('name') && r.members?.[1]?.fullName) return r.members[1].fullName;
  }

  // Member 4 fallbacks
  if (normKey.includes('member4') || normKey.includes('member_4')) {
    if (normKey.includes('email') && r.members?.[2]?.email) return r.members[2].email;
    if (normKey.includes('name') && r.members?.[2]?.fullName) return r.members[2].fullName;
  }

  if (normKey.includes('transaction') || normKey.includes('utr')) {
    if (r.transactionId && r.transactionId !== 'FREE-REGISTRATION') return r.transactionId;
  }

  return '';
}

export async function GET(req: NextRequest) {
  const guard = await requirePermission('registration:export');
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const domain = searchParams.get('domain');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    let targetSchemaFields: IFormField[] = [];

    if (eventId && eventId !== 'all' && Types.ObjectId.isValid(eventId)) {
      filter.eventId = new Types.ObjectId(eventId);

      // Fetch event's configured FormSchema if available
      const eventDoc = await EventModel.findById(eventId)
        .populate('registration.formSchemaId')
        .lean();

      if (eventDoc?.registration?.formSchemaId) {
        const schemaDoc = eventDoc.registration.formSchemaId as unknown as { fields?: IFormField[] };
        if (Array.isArray(schemaDoc.fields) && schemaDoc.fields.length > 0) {
          targetSchemaFields = schemaDoc.fields;
        }
      }
    }

    if (domain && domain !== 'all') {
      filter.domain = domain;
    }

    const registrations = await Registration.find(filter)
      .populate('eventId', 'title slug registration.formSchemaId')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const origin = req.nextUrl.origin;
    const regDocs = registrations as unknown as RegistrationDoc[];

    // If no specific event schema was found, collect all unique schema fields across events or formData
    if (targetSchemaFields.length === 0) {
      const fieldMap = new Map<string, IFormField>();

      // Check populated form schemas first
      for (const r of regDocs) {
        const schemaObj = r.eventId?.registration?.formSchemaId as unknown as { fields?: IFormField[] };
        if (schemaObj?.fields) {
          for (const f of schemaObj.fields) {
            if (!fieldMap.has(f.key)) {
              fieldMap.set(f.key, f);
            }
          }
        }
      }

      // Check formData keys as fallback
      for (const r of regDocs) {
        if (r.formData && typeof r.formData === 'object') {
          for (const k of Object.keys(r.formData)) {
            if (k === 'eventId' || k === 'transactionId' || k === 'paymentScreenshot') continue;
            if (!fieldMap.has(k)) {
              // Convert camelCase/snake_case to clean Title Label
              const label = k
                .replace(/([A-Z])/g, ' $1')
                .replace(/_/g, ' ')
                .replace(/^\w/, (c) => c.toUpperCase())
                .trim();
              fieldMap.set(k, { key: k, label, type: 'text', required: false });
            }
          }
        }
      }

      targetSchemaFields = Array.from(fieldMap.values());
    }

    // Default fallback if schema fields are completely empty
    if (targetSchemaFields.length === 0) {
      targetSchemaFields = [
        { key: 'squadName', label: 'Squad / Team Name', type: 'text', required: true },
        { key: 'domain', label: 'Domain / Category', type: 'text', required: true },
        { key: 'leaderFullName', label: 'Leader Full Name', type: 'text', required: true },
        { key: 'leaderEmail', label: 'Leader Email', type: 'email', required: true },
        { key: 'leaderPhone', label: 'Leader Phone Number', type: 'phone', required: true },
        { key: 'leaderCollege', label: 'College / Institute Name', type: 'text', required: true },
      ];
    }

    // Generate Excel row objects matching exact Form Schema column titles
    const rows = regDocs.map((r, i) => {
      const rowObj: Record<string, unknown> = {
        'S.No': i + 1,
        'Event': r.eventId?.title || 'General / Unspecified',
        'Status': r.status ? r.status.toUpperCase() : 'PENDING',
      };

      // Map every single Form Schema Field into Excel columns using exact Label!
      for (const f of targetSchemaFields) {
        // Skip file screenshot inputs in dynamic fields as screenshot link is attached separately
        if (f.type === 'file' && (f.key.includes('screenshot') || f.label.toLowerCase().includes('screenshot'))) {
          continue;
        }

        const val = getFieldValue(r, f.key, f.label);
        rowObj[f.label] = val !== undefined && val !== null ? val : '';
      }

      // Append Transaction ID & Payment Screenshot link columns
      const txId = r.transactionId && r.transactionId !== 'FREE-REGISTRATION'
        ? r.transactionId
        : String(r.formData?.transactionId || r.formData?.transaction_id || '');

      if (txId) {
        rowObj['Transaction ID / UTR'] = txId;
      }

      if (r.paymentScreenshot) {
        rowObj['Payment Screenshot URL'] = `${origin}/api/admin/screenshot/${r._id}`;
      }

      rowObj['Registered At'] = r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '';

      return rowObj;
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Registrations');

    const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
    sheet.columns = columns.map((key) => ({ header: key, key }));
    for (const row of rows) {
      sheet.addRow(row);
    }

    const buf: ExcelJS.Buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="registrations_${eventId || domain || 'all'}_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
