import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');

    if (!userId || !team) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and team type are required' 
      }, { status: 400 });
    }

    console.log(`🔍 Fetching marked branches for user: ${userId}, team: ${team}`);

    const { db } = await connectToDatabase();

    // Fetch marked branches for the user and team type
    const markedBranches = await db
      .collection('user_branch_assignments')
      .find({
        userId: userId,
        teamType: team,
        isMarked: true,
        isActive: true
      })
      .sort({ markedAt: -1 })
      .toArray();

    if (markedBranches.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: `No marked branches found for user ${userId} in team ${team}`
      });
    }

    // Get branch details for each marked branch
    const branchIds = markedBranches.map(mb => mb.branchId);
    const branches = await db
      .collection('branches')
      .find({ 
        _id: { $in: branchIds },
        isActive: true 
      })
      .toArray();

    // Combine branch data with assignment status
    const result = branches.map(branch => {
      const assignment = markedBranches.find(mb => mb.branchId.toString() === branch._id.toString());
      return {
        id: branch._id.toString(),
        name: branch.name,
        code: branch.branchCode || branch.code,
        address: branch.address,
        isActive: branch.isActive,
        assignedTeams: branch.assignedTeams || [team],
        userCount: branch.userCount || 1,
        isMarked: true,
        markedAt: assignment?.markedAt,
        markedBy: assignment?.markedBy,
        status: assignment?.status || 'pending'
      };
    });

    console.log(`✅ Found ${result.length} marked branches for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length
    });

  } catch (error) {
    console.error('Error fetching marked branches:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch marked branches'
    }, { status: 500 });
  }
}
