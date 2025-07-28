import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';

// GET - Check if user should be logged out due to data changes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID is required'
      }, { status: 400 });
    }

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        shouldLogout: false,
        message: 'Build mode - no logout checks'
      });
    }

    try {
      // Check for logout triggers
      const logoutCheck = await UserModel.checkLogoutTriggers(employeeId);

      console.log(`🔍 Logout check for ${employeeId}:`, logoutCheck);

      return NextResponse.json({
        success: true,
        shouldLogout: logoutCheck.shouldLogout,
        reason: logoutCheck.reason,
        metadata: logoutCheck.metadata,
        timestamp: new Date().toISOString(),
        message: logoutCheck.shouldLogout 
          ? `Logout required: ${logoutCheck.reason}` 
          : 'No logout required'
      });

    } catch (checkError) {
      console.error('Error checking logout triggers:', checkError);
      return NextResponse.json({
        success: true,
        shouldLogout: false,
        error: checkError instanceof Error ? checkError.message : 'Failed to check logout triggers',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error in logout check:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during logout check'
    }, { status: 500 });
  }
}

// POST - Manual trigger logout for user (admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, reason, metadata } = body;

    if (!employeeId || !reason) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID and reason are required'
      }, { status: 400 });
    }

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build mode - logout trigger mocked'
      });
    }

    try {
      await UserModel.createLogoutTrigger(employeeId, reason, metadata || {});

      console.log(`🚨 Manual logout trigger created for ${employeeId}: ${reason}`);

      return NextResponse.json({
        success: true,
        message: `Logout trigger created for user ${employeeId}`,
        data: {
          employeeId,
          reason,
          metadata,
          triggeredAt: new Date().toISOString()
        }
      });

    } catch (triggerError) {
      console.error('Error creating logout trigger:', triggerError);
      return NextResponse.json({
        success: false,
        error: triggerError instanceof Error ? triggerError.message : 'Failed to create logout trigger'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in manual logout trigger:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during logout trigger creation'
    }, { status: 500 });
  }
} 