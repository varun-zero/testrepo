import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isValidObjectId } from 'mongoose'
import { connectToDatabase } from '@/lib/mongodb'
import { requirePermission } from '@/lib/rbac'
import Certificate from '@/models/Certificate'

// 2 MB cap on the base64 string (~1.5 MB binary) prevents unbounded DB writes.
const MAX_IMAGE_DATA_LENGTH = 2 * 1024 * 1024

const updateSchema = z.object({
  action: z.enum(['download', 'share']).optional(),
  imageData: z
    .string()
    .max(MAX_IMAGE_DATA_LENGTH, 'imageData exceeds maximum allowed size')
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/, 'imageData must be a base64-encoded image')
    .optional(),
})

function shape(certificate: {
  _id: unknown
  certificateNumber: string
  name: string
  product: string
  email: string
  date: unknown
  status: string
  downloadCount?: number
  shareCount?: number
  createdAt?: Date
}) {
  return {
    id: certificate._id,
    certificateNumber: certificate.certificateNumber,
    name: certificate.name,
    product: certificate.product,
    email: certificate.email,
    date: certificate.date,
    status: certificate.status,
    downloadCount: certificate.downloadCount,
    shareCount: certificate.shareCount,
    createdAt: certificate.createdAt,
  }
}

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params
  if (!isValidObjectId(id)) return null
  return id
}

// GET - Get certificate by ID (admin only; returns PII)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission('certificate:manage')
  if (guard.error) return guard.error

  try {
    const id = await resolveId(params)
    if (!id) {
      return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 })
    }

    await connectToDatabase()

    const certificate = await Certificate.findById(id)

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      certificate: shape(certificate),
    })
  } catch (error) {
    console.error('Error fetching certificate:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch certificate' },
      { status: 500 }
    )
  }
}

// PUT - Update certificate (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission('certificate:manage')
  if (guard.error) return guard.error

  try {
    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid update payload', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { action, imageData } = parsed.data

    const id = await resolveId(params)
    if (!id) {
      return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 })
    }

    await connectToDatabase()

    const certificate = await Certificate.findById(id)

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificate not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {
      lastAccessed: new Date()
    }

    if (action === 'download') {
      updateData.downloadCount = (certificate.downloadCount || 0) + 1
      updateData.status = 'downloaded'
    } else if (action === 'share') {
      updateData.shareCount = (certificate.shareCount || 0) + 1
      updateData.status = 'shared'
    }

    if (imageData) {
      updateData.imageData = imageData
    }

    const updatedCertificate = await Certificate.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    if (!updatedCertificate) {
      return NextResponse.json(
        { success: false, message: 'Failed to update certificate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      certificate: shape(updatedCertificate),
    })
  } catch (error) {
    console.error('Error updating certificate:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update certificate' },
      { status: 500 }
    )
  }
}

// DELETE - Delete certificate (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission('certificate:manage')
  if (guard.error) return guard.error

  try {
    const id = await resolveId(params)
    if (!id) {
      return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 })
    }

    await connectToDatabase()

    const certificate = await Certificate.findByIdAndDelete(id)

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting certificate:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete certificate' },
      { status: 500 }
    )
  }
}
