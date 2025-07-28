import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';

// Debug endpoint to check and validate users
export async function GET(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Skipped during build time'
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const userId = searchParams.get('userId');
    const checkAll = searchParams.get('all') === 'true';

    console.log('🔍 DEBUG - Checking users:', { employeeId, userId, checkAll });

    const result: any = {};

    if (employeeId) {
      try {
        const userByEmployeeId = await UserModel.getUserByEmployeeId(employeeId);
        result.byEmployeeId = userByEmployeeId;
      } catch (error) {
        result.byEmployeeId = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    if (userId) {
      try {
        const userById = await UserModel.getUserById(userId);
        result.byUserId = userById;
      } catch (error) {
        result.byUserId = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    if (checkAll || (!employeeId && !userId)) {
      try {
        const allUsers = await UserModel.getAllUsers();
        result.allUsers = {
          count: allUsers.length,
          users: allUsers.map(user => ({
            _id: user._id?.toString(),
            employeeId: user.employeeId,
            name: user.fullName,
            role: user.role,
            department: user.department,
            branch: user.branch,
            isActive: user.isActive
          }))
        };
      } catch (error) {
        result.allUsers = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Debug check-users endpoint error:', error);
    
    // Return empty data during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Skipped during build time'
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// POST - Test user validation
export async function POST(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Skipped during build time'
        }
      });
    }

    const body = await request.json();
    const { employeeId } = body;

    console.log('🔍 DEBUG - Testing user validation for:', employeeId);

    if (!employeeId) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID is required'
      }, { status: 400 });
    }

    try {
      const user = await UserModel.getUserByEmployeeId(employeeId);

      return NextResponse.json({
        success: true,
        data: {
          user: {
            _id: user?._id?.toString(),
            employeeId: user?.employeeId,
            fullName: user?.fullName,
            role: user?.role,
            department: user?.department,
            branch: user?.branch,
            isActive: user?.isActive,
            exists: !!user
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Debug check-users POST endpoint error:', error);
    
    // Return empty data during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Skipped during build time'
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}