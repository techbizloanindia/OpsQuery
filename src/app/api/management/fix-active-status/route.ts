import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// POST endpoint to fix isActive status for existing management users
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('management_users');

    // Update all management users that don't have isActive field or have it set to false
    const updateResult = await collection.updateMany(
      {
        $or: [
          { isActive: { $exists: false } },
          { isActive: false }
        ]
      },
      {
        $set: {
          isActive: true,
          updatedAt: new Date()
        }
      }
    );

    console.log('Fixed isActive status for management users:', updateResult);

    // Get updated count
    const activeCount = await collection.countDocuments({ isActive: true });
    const totalCount = await collection.countDocuments({});

    return NextResponse.json({
      success: true,
      message: 'Management users active status updated successfully',
      data: {
        modifiedCount: updateResult.modifiedCount,
        activeUsers: activeCount,
        totalUsers: totalCount
      }
    });

  } catch (error) {
    console.error('Error fixing management users active status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update management users active status'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current status
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('management_users');

    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$isActive', false] }, 1, 0]
            }
          },
          noActiveField: {
            $sum: {
              $cond: [{ $exists: ['$isActive'] }, 0, 1]
            }
          }
        }
      }
    ]).toArray();

    const result = stats[0] || { total: 0, active: 0, inactive: 0, noActiveField: 0 };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error checking management users status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check management users status'
      },
      { status: 500 }
    );
  }
}
