import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const includeLoginStatus = searchParams.get('includeLoginStatus') === 'true';

    if (!role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role parameter is required' 
        },
        { status: 400 }
      );
    }

    // Get users by role
    const users = await UserModel.getUsersByRole(role);

    // If login status is requested, get recent login data
    let usersWithLoginStatus = users;
    
    if (includeLoginStatus) {
      try {
        const { db } = await connectToDatabase();
        const loginSessionsCollection = db.collection('login_sessions');
        
        // Get recent login sessions for these users
        const userIds = users.map(user => user._id?.toString()).filter(Boolean);
        
        const recentSessions = await loginSessionsCollection.find({
          userId: { $in: userIds },
          loginTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }).sort({ loginTime: -1 }).toArray();

        // Create a map of user login status
        const userLoginStatus = new Map();
        
        for (const session of recentSessions) {
          const userId = session.userId.toString();
          if (!userLoginStatus.has(userId)) {
            userLoginStatus.set(userId, {
              isOnline: session.status === 'active',
              lastLogin: session.loginTime,
              sessionDuration: session.sessionDuration,
              ipAddress: session.ipAddress
            });
          }
        }

        // Merge login status with user data
        usersWithLoginStatus = users.map(user => ({
          ...user,
          loginStatus: userLoginStatus.get(user._id?.toString()) || {
            isOnline: false,
            lastLogin: null,
            sessionDuration: null,
            ipAddress: null
          }
        }));
        
      } catch (loginError) {
        console.warn('Could not fetch login status:', loginError);
        // Continue without login status if there's an error
      }
    }

    // Sort users by online status first, then by name
    if (includeLoginStatus) {
      usersWithLoginStatus.sort((a: any, b: any) => {
        // Online users first
        if (a.loginStatus?.isOnline && !b.loginStatus?.isOnline) return -1;
        if (!a.loginStatus?.isOnline && b.loginStatus?.isOnline) return 1;
        
        // Then by name
        return (a.fullName || '').localeCompare(b.fullName || '');
      });
    }

    return NextResponse.json({
      success: true,
      data: usersWithLoginStatus,
      count: usersWithLoginStatus.length,
      role: role
    });

  } catch (error) {
    console.error('Error fetching users by role:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users by role' 
      },
      { status: 500 }
    );
  }
}
