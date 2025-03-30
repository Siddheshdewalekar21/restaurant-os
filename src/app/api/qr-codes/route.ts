import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import QRCode from 'qrcode';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/api';

// Schema for creating QR codes
const qrCodeSchema = z.object({
  tableId: z.string().optional(),
  branchId: z.string(),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

// GET /api/qr-codes - Get all QR codes
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');
    
    // Build where clause
    const whereClause: any = {};
    if (tableId) whereClause.tableId = tableId;
    if (branchId) whereClause.branchId = branchId;
    if (isActive !== null) whereClause.isActive = isActive === 'true';
    
    const qrCodes = await prisma.qRCode.findMany({
      where: whereClause,
      include: {
        table: true,
        branch: true,
      },
    });
    
    return successResponse(qrCodes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return errorResponse('Failed to fetch QR codes', 500);
  }
}

// POST /api/qr-codes - Create a new QR code
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = qrCodeSchema.safeParse(body);
    
    if (!result.success) {
      return validationErrorResponse(result.error.flatten().fieldErrors);
    }
    
    const { tableId, branchId, expiresAt } = result.data;
    
    // Generate unique code
    const uniqueCode = `${branchId}-${tableId || 'general'}-${Date.now()}`;
    
    // Create QR code in database
    const qrCode = await prisma.qRCode.create({
      data: {
        code: uniqueCode,
        tableId,
        branchId,
        expiresAt,
        isActive: true,
      },
      include: {
        table: true,
        branch: true,
      },
    });
    
    // Generate QR code image
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrCodeUrl = `${baseUrl}/order?code=${qrCode.code}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);
    
    return successResponse({
      ...qrCode,
      qrCodeImage,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return errorResponse('Failed to create QR code', 500);
  }
} 