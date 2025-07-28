import { NextRequest, NextResponse } from 'next/server';
import { ManagementModel } from '@/lib/models/Management';

// Debug endpoint to check management users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managementId = searchParams.get('managementId');
    const employeeId = searchParams.get('employeeId');

    console.log('🔍 DEBUG - Checking management user:', { managementId, employeeId });

    const result: any = {};

    if (managementId) {
      const userById = await ManagementModel.getManagementUserById(managementId);
      result.byManagementId = userById;
    }

    if (employeeId) {
      const userByEmployeeId = await ManagementModel.getManagementUserByEmployeeId(employeeId);
      result.byEmployeeId = userByEmployeeId;
    }

    if (!managementId && !employeeId) {
      const allUsers = await ManagementModel.getAllManagementUsers();
      result.allUsers = allUsers;
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
