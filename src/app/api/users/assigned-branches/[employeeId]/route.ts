import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';

// GET - Fetch user's assigned branches for sales/credit dashboards
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { employeeId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team') as 'sales' | 'credit' | null;

    console.log(`🔍 Fetching assigned branches for ${team} user: ${employeeId}`);

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'Build mode - returning empty data'
      });
    }

    // Validate team parameter
    if (!team || !['sales', 'credit'].includes(team)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or missing team parameter. Must be "sales" or "credit"',
        data: []
      }, { status: 400 });
    }

    // Get user information and assigned branches
    const userInfo = await UserModel.getUserByEmployeeId(employeeId);
    
    if (!userInfo) {
      return NextResponse.json({
        success: false,
        error: `User with employee ID ${employeeId} not found`,
        data: []
      }, { status: 404 });
    }

    // Validate user belongs to the requested team
    if (userInfo.role !== team) {
      return NextResponse.json({
        success: false,
        error: `Access denied: User ${employeeId} does not belong to ${team} team`,
        data: [],
        userRole: userInfo.role,
        requestedTeam: team
      }, { status: 403 });
    }

    // Get assigned branches from UserModel
    const assignedBranches = await UserModel.getUserAssignedBranches(employeeId, team);
    
    // Format response for dashboard consumption
    const formattedBranches = assignedBranches.map(branch => ({
      branchCode: branch.branchCode,
      branchName: branch.branchName,
      assignedAt: branch.assignedAt || new Date().toISOString(),
      team: team,
      isActive: true,
      source: 'database'
    }));

    console.log(`✅ Found ${formattedBranches.length} assigned branches for ${team} user ${employeeId}`);

    return NextResponse.json({
      success: true,
      data: formattedBranches,
      count: formattedBranches.length,
      user: {
        employeeId: userInfo.employeeId,
        name: userInfo.fullName || userInfo.username,
        role: userInfo.role,
        team: team
      },
      timestamp: new Date().toISOString(),
      metadata: {
        employeeId,
        team,
        totalBranches: formattedBranches.length,
        lastUpdated: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Team': team,
        'X-Branch-Count': formattedBranches.length.toString()
      }
    });

  } catch (error) {
    console.error('Error fetching assigned branches:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assigned branches',
      data: [],
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
