import { NextRequest, NextResponse } from 'next/server';
import { ManagementModel } from '@/lib/models/Management';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    // Get all management users for selection
    const managementUsers = await ManagementModel.getAllManagementUsers();
    
    // Filter active users if requested
    const filteredUsers = activeOnly 
      ? managementUsers.filter(user => user.isActive !== false)
      : managementUsers;

    // Format for display in operations dashboard
    const formattedUsers = filteredUsers.map(user => ({
      managementId: user.managementId,
      employeeId: user.employeeId,
      name: user.name,
      permissions: user.permissions || [],
      canApproveGeneral: user.permissions?.includes('approve_queries') || false,
      canApproveOTC: user.permissions?.includes('approve_otc_queries') || false,
      canApproveDeferral: user.permissions?.includes('approve_deferral_queries') || false,
      queryTeamPreferences: user.queryTeamPreferences || ['both']
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      count: formattedUsers.length,
      message: `Retrieved ${formattedUsers.length} management users`
    });

  } catch (error) {
    console.error('Error fetching management users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch management users',
      data: []
    }, { status: 500 });
  }
}
