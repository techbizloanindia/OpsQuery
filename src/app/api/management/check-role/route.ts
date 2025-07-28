import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managementId = searchParams.get('managementId');

    if (!managementId) {
      return NextResponse.json(
        { success: false, error: 'Management ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Find management user by managementId
    const managementUser = await db
      .collection(process.env.MONGODB_MANAGEMENT_COLLECTION || 'management_users')
      .findOne(
        { managementId: managementId },
        { projection: { managementId: 1, employeeId: 1, name: 1, role: 1, permissions: 1 } }
      );

    if (!managementUser) {
      console.log(`⚠️ Management ID not found during role check: ${managementId}`);
      return NextResponse.json({
        success: true,
        data: {
          hasRole: false,
          role: null,
          managementId: managementId
        }
      });
    }

    console.log(`✅ Management role check successful for: ${managementId} - Role: ${managementUser.role || 'management'}`);
    
    return NextResponse.json({
      success: true,
      data: {
        hasRole: true,
        role: managementUser.role || 'management',
        managementId: managementUser.managementId,
        employeeId: managementUser.employeeId,
        name: managementUser.name,
        permissions: managementUser.permissions || []
      }
    });

  } catch (error) {
    console.error('💥 Management role check API error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
