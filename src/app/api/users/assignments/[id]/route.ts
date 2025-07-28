import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');
    const realtime = searchParams.get('realtime') === 'true';

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    console.log(`🔍 Fetching branches for user ${userId}, team: ${team || 'all'}, realtime: ${realtime}`);

    const { db } = await connectToDatabase();

    // Build query filter
    const filter: any = {
      userId: userId,
      isActive: true
    };

    if (team) {
      filter.teamType = team;
    }

    // Fetch user's branch assignments
    const assignments = await db
      .collection('user_branch_assignments')
      .find(filter)
      .sort({ markedAt: -1 })
      .toArray();

    if (assignments.length === 0) {
      console.log(`📍 No branch assignments found for user ${userId}`);
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'No branch assignments found'
      });
    }

    // Get branch details for each assignment
    const branchIds = assignments.map(assignment => 
      typeof assignment.branchId === 'string' 
        ? new ObjectId(assignment.branchId) 
        : assignment.branchId
    );

    const branches = await db
      .collection('branches')
      .find({ 
        _id: { $in: branchIds },
        isActive: true 
      })
      .toArray();

    // Combine branch data with assignment status
    const result = branches.map(branch => {
      const assignment = assignments.find(a => 
        a.branchId.toString() === branch._id.toString()
      );
      
      return {
        id: branch._id.toString(),
        branchId: branch._id.toString(),
        name: branch.name,
        code: branch.branchCode || branch.code,
        branchCode: branch.branchCode || branch.code,
        address: branch.address,
        isActive: branch.isActive,
        assignedTeams: branch.assignedTeams || [team || 'sales'],
        userCount: branch.userCount || 1,
        
        // Assignment details
        isMarked: assignment?.isMarked || false,
        markedAt: assignment?.markedAt,
        markedBy: assignment?.markedBy,
        status: assignment?.status || 'pending',
        teamType: assignment?.teamType,
        acceptedAt: assignment?.acceptedAt,
        declinedAt: assignment?.declinedAt,
        lastUpdated: assignment?.lastUpdated || branch.lastUpdated
      };
    });

    // Filter results based on request type
    let filteredResult = result;
    
    if (realtime) {
      // For realtime requests, return all assignments for sync purposes
      console.log(`🔄 Realtime sync: Found ${result.length} branch assignments for user ${userId}`);
    } else {
      // For regular requests, filter by status if needed
      const statusFilter = searchParams.get('status');
      if (statusFilter) {
        filteredResult = result.filter(branch => branch.status === statusFilter);
      }
    }

    // Sort by status priority (accepted first, then pending, then declined)
    filteredResult.sort((a, b) => {
      const statusPriority = { accepted: 0, pending: 1, declined: 2 };
      return (statusPriority[a.status as keyof typeof statusPriority] || 3) - 
             (statusPriority[b.status as keyof typeof statusPriority] || 3);
    });

    console.log(`✅ Returning ${filteredResult.length} branches for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: filteredResult,
      count: filteredResult.length,
      metadata: {
        userId,
        team,
        realtime,
        totalAssignments: assignments.length,
        totalBranches: branches.length,
        lastSync: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching user branches:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user branches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
