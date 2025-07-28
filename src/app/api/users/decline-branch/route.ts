import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, branchId, branchCode, teamType, action } = body;

    if (!userId || !branchId || !teamType || action !== 'decline') {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    console.log(`🏢 User ${userId} declining branch ${branchCode} for team ${teamType}`);

    const { db } = await connectToDatabase();

    // Convert branchId to ObjectId if it's a string
    const branchObjectId = typeof branchId === 'string' ? new ObjectId(branchId) : branchId;

    // Update the declined branch assignment
    const result = await db.collection('user_branch_assignments').updateOne(
      {
        userId: userId,
        branchId: branchObjectId,
        teamType: teamType
      },
      {
        $set: {
          status: 'declined',
          declinedAt: new Date(),
          lastUpdated: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Branch assignment not found'
      }, { status: 404 });
    }

    // Log the branch decline activity
    await db.collection('user_activities').insertOne({
      userId: userId,
      action: 'branch_declined',
      branchId: branchObjectId,
      branchCode: branchCode,
      teamType: teamType,
      timestamp: new Date(),
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    });

    console.log(`✅ Branch ${branchCode} declined successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Branch ${branchCode} declined successfully`,
      data: {
        branchId,
        branchCode,
        status: 'declined',
        declinedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error declining branch:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to decline branch assignment'
    }, { status: 500 });
  }
}
