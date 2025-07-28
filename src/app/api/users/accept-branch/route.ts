import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, branchId, branchCode, teamType, action } = body;

    if (!userId || !branchId || !teamType || action !== 'accept') {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    console.log(`🏢 User ${userId} accepting branch ${branchCode} for team ${teamType}`);

    const { client, db } = await connectToDatabase();

    // Convert branchId to ObjectId if it's a string
    const branchObjectId = typeof branchId === 'string' ? new ObjectId(branchId) : branchId;

    // Start a session for transaction
    const session = client.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update the accepted branch assignment
        await db.collection('user_branch_assignments').updateOne(
          {
            userId: userId,
            branchId: branchObjectId,
            teamType: teamType
          },
          {
            $set: {
              status: 'accepted',
              acceptedAt: new Date(),
              lastUpdated: new Date()
            }
          },
          { session }
        );

        // Decline all other branch assignments for this user and team
        await db.collection('user_branch_assignments').updateMany(
          {
            userId: userId,
            teamType: teamType,
            branchId: { $ne: branchObjectId }
          },
          {
            $set: {
              status: 'declined',
              declinedAt: new Date(),
              lastUpdated: new Date()
            }
          },
          { session }
        );

        // Log the branch selection activity
        await db.collection('user_activities').insertOne({
          userId: userId,
          action: 'branch_accepted',
          branchId: branchObjectId,
          branchCode: branchCode,
          teamType: teamType,
          timestamp: new Date(),
          metadata: {
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          }
        }, { session });

        // Update user's current branch in users collection
        await db.collection('users').updateOne(
          { employeeId: userId },
          {
            $set: {
              [`currentBranch.${teamType}`]: {
                branchId: branchObjectId,
                branchCode: branchCode,
                assignedAt: new Date()
              },
              lastUpdated: new Date()
            }
          },
          { session }
        );
      });

      console.log(`✅ Branch ${branchCode} accepted successfully for user ${userId}`);

      return NextResponse.json({
        success: true,
        message: `Branch ${branchCode} accepted successfully`,
        data: {
          branchId,
          branchCode,
          status: 'accepted',
          acceptedAt: new Date()
        }
      });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error accepting branch:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to accept branch assignment'
    }, { status: 500 });
  }
}
