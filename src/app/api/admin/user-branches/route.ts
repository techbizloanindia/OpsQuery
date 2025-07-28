import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { BranchModel } from '@/lib/models/Branch';

// GET - Get all users with their branch assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team') as 'sales' | 'credit' | null;

    console.log(`🔍 Admin: Fetching user branch assignments for team: ${team || 'all'}`);

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Build mode - returning empty data'
      });
    }

    try {
      // Get users by role if team specified
      let users;
      if (team) {
        users = await UserModel.getUsersByRole(team);
      } else {
        // Get all sales and credit users
        const salesUsers = await UserModel.getUsersByRole('sales');
        const creditUsers = await UserModel.getUsersByRole('credit');
        users = [...salesUsers, ...creditUsers];
      }

      // Enhance with branch assignment info
      const usersWithBranches = users.map(user => ({
        employeeId: user.employeeId,
        name: user.fullName,
        role: user.role,
        email: user.email,
        isActive: user.isActive,
        primaryBranch: user.branch,
        primaryBranchCode: user.branchCode,
        assignedBranches: user.branches || [],
        branchCount: (user.branches || []).length,
        lastUpdated: user.updatedAt,
        branchAssignmentChangedAt: (user as any).branchAssignmentChangedAt || null
      }));

      console.log(`✅ Admin: Found ${usersWithBranches.length} users with branch assignments`);

      return NextResponse.json({
        success: true,
        data: usersWithBranches,
        count: usersWithBranches.length,
        summary: {
          totalUsers: usersWithBranches.length,
          usersWithBranches: usersWithBranches.filter(u => u.branchCount > 0).length,
          usersWithoutBranches: usersWithBranches.filter(u => u.branchCount === 0).length,
          salesUsers: usersWithBranches.filter(u => u.role === 'sales').length,
          creditUsers: usersWithBranches.filter(u => u.role === 'credit').length
        },
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Database error',
        data: []
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in admin user branches endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Bulk assign branches to multiple users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body;

    // Validate input
    if (!Array.isArray(assignments)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input: assignments array is required'
      }, { status: 400 });
    }

    console.log(`🏷️ Admin: Bulk assigning branches to ${assignments.length} users`);

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build mode - bulk assignment mocked'
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const assignment of assignments) {
      try {
        const { employeeId, branches, team } = assignment;

        if (!employeeId || !Array.isArray(branches) || !team) {
          results.push({
            employeeId,
            success: false,
            error: 'Missing required fields: employeeId, branches, or team'
          });
          errorCount++;
          continue;
        }

        if (!['sales', 'credit'].includes(team)) {
          results.push({
            employeeId,
            success: false,
            error: 'Invalid team: must be either sales or credit'
          });
          errorCount++;
          continue;
        }

        // Assign branches to user
        const updatedUser = await UserModel.assignBranchesToUser(employeeId, branches, team);

        if (updatedUser) {
          results.push({
            employeeId,
            success: true,
            assignedBranches: updatedUser.branches,
            branchCount: (updatedUser.branches || []).length
          });
          successCount++;
        } else {
          results.push({
            employeeId,
            success: false,
            error: 'Failed to assign branches to user'
          });
          errorCount++;
        }

      } catch (assignError) {
        console.error(`Error assigning branches to ${assignment.employeeId}:`, assignError);
        results.push({
          employeeId: assignment.employeeId,
          success: false,
          error: assignError instanceof Error ? assignError.message : 'Assignment failed'
        });
        errorCount++;
      }
    }

    console.log(`✅ Admin: Bulk assignment complete. Success: ${successCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: `Bulk assignment complete. ${successCount} successful, ${errorCount} failed.`,
      results,
      summary: {
        total: assignments.length,
        successful: successCount,
        failed: errorCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in bulk branch assignment:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during bulk assignment'
    }, { status: 500 });
  }
} 