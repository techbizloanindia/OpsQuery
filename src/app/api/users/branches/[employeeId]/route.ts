import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/lib/models/User';

// GET - Fetch user's assigned branch codes directly from database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { employeeId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team') as 'sales' | 'credit' | null;
    const realtime = searchParams.get('realtime') === 'true';
    const nocache = searchParams.get('nocache') === 'true';

    console.log(`🔍 Fetching REAL branch assignments for employee: ${employeeId}, team: ${team}, realtime: ${realtime}, nocache: ${nocache}`);

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Build mode - returning empty data'
      });
    }

    try {
      // Connect to database and get user information
      await connectToDatabase();
      
      // Get user information first to validate team access
      const userInfo = await UserModel.getUserByEmployeeId(employeeId);
      
      if (!userInfo) {
        return NextResponse.json({
          success: false,
          error: `User with employee ID ${employeeId} not found`,
          data: [],
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      // Validate team access - ensure user belongs to requested team
      if (team && userInfo.role !== team) {
        console.warn(`⚠️ Access denied: User ${employeeId} (role: ${userInfo.role}) cannot access ${team} branches`);
        return NextResponse.json({
          success: false,
          error: `Access denied: User does not belong to ${team} team`,
          data: [],
          userRole: userInfo.role,
          requestedTeam: team,
          timestamp: new Date().toISOString()
        }, { status: 403 });
      }

      console.log(`✅ User validated: ${employeeId} belongs to ${userInfo.role} team`);

      // Get REAL branch assignments from database - user.branches array
      const assignedBranches = await UserModel.getUserAssignedBranches(employeeId, team || undefined);
      
      if (assignedBranches.length === 0) {
        console.log(`❌ No REAL branch assignments found in database for user: ${employeeId} in team: ${team || userInfo.role}`);
        
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          message: `No branch assignments found in database for user ${employeeId}. Please contact admin to assign branches.`,
          timestamp: new Date().toISOString(),
          source: 'database-direct'
        });
      }

      console.log(`✅ Found ${assignedBranches.length} REAL branch assignments in database for user ${employeeId}:`, 
        assignedBranches.map(b => b.branchCode).join(', '));

      // Always return fresh data from database - no enhancement needed
      const finalBranches = assignedBranches.map(branch => ({
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        assignedAt: branch.assignedAt,
        team: branch.team || team || userInfo.role,
        isActive: branch.isActive !== false,
        source: 'database-direct',
        lastUpdated: new Date()
      }));

      console.log(`📊 Returning ${finalBranches.length} REAL branch assignments for user ${employeeId}`);

      return NextResponse.json({
        success: true,
        data: finalBranches,
        count: finalBranches.length,
        timestamp: new Date().toISOString(),
        source: 'database-direct',
        nocache: nocache,
        headers: {
          'Cache-Control': realtime ? 'no-cache, no-store, must-revalidate' : 'public, max-age=300',
          'X-Realtime-Update': realtime ? 'enabled' : 'disabled',
          'X-Source': 'database-direct'
        }
      });

    } catch (dbError) {
      console.error('❌ Database error fetching branch assignments:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error occurred while fetching branch assignments',
        data: [],
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in branch assignment API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Assign/mark branches to user (for admin use)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { employeeId } = resolvedParams;
    const body = await request.json();
    const { branches, team } = body;

    console.log(`🏷️ Marking branches for user ${employeeId}:`, { branches, team });

    // Validate input
    if (!Array.isArray(branches) || !team) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input: branches array and team are required'
      }, { status: 400 });
    }

    if (!['sales', 'credit'].includes(team)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid team: must be either sales or credit'
      }, { status: 400 });
    }

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build mode - branch assignment mocked'
      });
    }

    try {
      // Use the new UserModel method to assign branches
      const updatedUser = await UserModel.assignBranchesToUser(employeeId, branches, team);
      
      if (!updatedUser) {
        return NextResponse.json({
          success: false,
          error: 'Failed to assign branches to user'
        }, { status: 404 });
      }

      console.log(`✅ Successfully marked ${branches.length} branches for user ${employeeId}`);

      return NextResponse.json({
        success: true,
        message: `Successfully marked ${branches.length} branches for ${team} user ${employeeId}`,
        data: {
          employeeId: updatedUser.employeeId,
          assignedBranches: updatedUser.branches,
          updatedAt: updatedUser.updatedAt
        },
        timestamp: new Date().toISOString()
      });

    } catch (assignError) {
      console.error('Error assigning branches:', assignError);
      return NextResponse.json({
        success: false,
        error: assignError instanceof Error ? assignError.message : 'Failed to assign branches'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in branch assignment:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during branch assignment'
    }, { status: 500 });
  }
}

// DELETE - Remove branch assignments from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { employeeId } = resolvedParams;

    console.log(`🗑️ Removing branch assignments for user ${employeeId}`);

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build mode - branch removal mocked'
      });
    }

    try {
      const updatedUser = await UserModel.removeBranchesFromUser(employeeId);
      
      if (!updatedUser) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }

      console.log(`✅ Successfully removed branch assignments for user ${employeeId}`);

      return NextResponse.json({
        success: true,
        message: `Successfully removed branch assignments for user ${employeeId}`,
        data: {
          employeeId: updatedUser.employeeId,
          updatedAt: updatedUser.updatedAt
        },
        timestamp: new Date().toISOString()
      });

    } catch (removeError) {
      console.error('Error removing branches:', removeError);
      return NextResponse.json({
        success: false,
        error: removeError instanceof Error ? removeError.message : 'Failed to remove branches'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in branch removal:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during branch removal'
    }, { status: 500 });
  }
}
