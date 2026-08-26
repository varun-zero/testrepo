import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { rateLimit } from '@/lib/rate-limit'
import { requirePermission } from '@/lib/rbac'
import Certificate from '@/models/Certificate'

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  product: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  certificateNumber: z.string().trim().min(1).max(100),
  date: z.union([z.string(), z.number()]),
})

// GET - Public certificate verification lookup by email.
// Read-only and rate-limited; all write access requires `certificate:manage`.
export async function GET(req: NextRequest) {
  try {
    // Rate limit lookups: 30 per 10 minutes per IP
    const limited = await rateLimit(req, { name: 'certificate-lookup', limit: 30, windowMs: 10 * 60 * 1000 })
    if (limited) return limited

    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    const parsedEmail = z.string().trim().email().max(320).safeParse(email)
    if (!parsedEmail.success) {
      return NextResponse.json(
        { success: false, message: 'A valid email parameter is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const certificate = await Certificate.findOne({
      email: parsedEmail.data.toLowerCase()
    }).sort({ createdAt: -1 })

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Update last accessed time
    await Certificate.findByIdAndUpdate(certificate._id, {
      lastAccessed: new Date()
    })

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        name: certificate.name,
        product: certificate.product,
        email: certificate.email,
        date: certificate.date,
        status: certificate.status,
        downloadCount: certificate.downloadCount,
        shareCount: certificate.shareCount,
        createdAt: certificate.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching certificate:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch certificate' },
      { status: 500 }
    )
  }
}

// POST - Create new certificate (admin only)
export async function POST(req: NextRequest) {
  const guard = await requirePermission('certificate:manage')
  if (guard.error) return guard.error

  try {
    // Rate limit creation: 10 per 10 minutes per IP
    const limited = await rateLimit(req, { name: 'certificate-create', limit: 10, windowMs: 10 * 60 * 1000 })
    if (limited) return limited

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid certificate payload', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, product, email, certificateNumber, date } = parsed.data

    await connectToDatabase()

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      certificateNumber
    })

    if (existingCertificate) {
      return NextResponse.json(
        { success: false, message: 'Certificate number already exists' },
        { status: 409 }
      )
    }

    // Create new certificate
    const certificate = new Certificate({
      certificateNumber,
      name,
      product,
      email: email.toLowerCase(),
      date,
      status: 'generated'
    })

    await certificate.save()

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        name: certificate.name,
        product: certificate.product,
        email: certificate.email,
        date: certificate.date,
        status: certificate.status,
        createdAt: certificate.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating certificate:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create certificate' },
      { status: 500 }
    )
  }
}


