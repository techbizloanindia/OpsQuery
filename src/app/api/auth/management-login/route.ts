import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { managementId, password } = await request.json();

    if (!managementId || !password) {
      return NextResponse.json(
        { success: false, error: 'Management ID and password are required', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Find management user by managementId
    const managementUser = await db
      .collection(process.env.MONGODB_MANAGEMENT_COLLECTION || 'management_users')
      .findOne({ managementId: managementId });

    if (!managementUser) {
      console.log(`❌ Management user not found: ${managementId}`);
      return NextResponse.json(
        { success: false, error: 'Management ID not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check password (assuming plain text for now - should be hashed in production)
    if (managementUser.password !== password) {
      console.log(`❌ Invalid password for Management ID: ${managementId}`);
      return NextResponse.json(
        { success: false, error: 'Invalid password', code: 'INVALID_PASSWORD' },
        { status: 401 }
      );
    }

    // Generate a simple token (in production, use proper JWT)
    const token = `mgt_${managementId}_${Date.now()}`;

    // Return success with user data and token
    const userData = {
      managementId: managementUser.managementId,
      employeeId: managementUser.employeeId,
      name: managementUser.name,
      email: managementUser.email,
      role: 'management',
      permissions: managementUser.permissions || [],
      queryTeamPreferences: managementUser.queryTeamPreferences || []
    };

    console.log(`✅ Management login successful for: ${managementId}`);
    
    return NextResponse.json({
      success: true,
      user: userData,
      token: token,
      redirectTo: '/management-dashboard'
    });

  } catch (error) {
    console.error('💥 Management login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error occurred', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
