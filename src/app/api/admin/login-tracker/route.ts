import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

interface LoginSession {
  _id: string;
  userId: string;
  username: string;
  fullName: string;
  role: 'operations' | 'sales' | 'credit';
  department: string;
  branch: string;
  loginTime: Date;
  logoutTime?: Date;
  ipAddress?: string;
  userAgent?: string;
  status: 'active' | 'logged_out';
  sessionDuration?: number;
}

interface LoginStats {
  operations: {
    totalUsers: number;
    activeUsers: number;
    totalLogins: number;
    avgSessionTime: number;
  };
  sales: {
    totalUsers: number;
    activeUsers: number;
    totalLogins: number;
    avgSessionTime: number;
  };
  credit: {
    totalUsers: number;
    activeUsers: number;
    totalLogins: number;
    avgSessionTime: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    console.log('📊 Login Tracker API: Fetching login data for range:', range);

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const { db } = await connectToDatabase();
    
    console.log('📊 Querying database from:', startDate.toISOString());

    // Get users by role for statistics
    const usersCollection = db.collection('users');
    const [operationsUsers, salesUsers, creditUsers] = await Promise.all([
      usersCollection.countDocuments({ role: 'operations', isActive: true }),
      usersCollection.countDocuments({ role: 'sales', isActive: true }),
      usersCollection.countDocuments({ role: 'credit', isActive: true })
    ]);

    // Check if login_sessions collection exists, if not create it
    const collections = await db.listCollections({ name: 'login_sessions' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('login_sessions');
      console.log('📊 Created login_sessions collection');
    }

    const loginSessionsCollection = db.collection('login_sessions');

    // Get login sessions for the specified date range
    const loginSessions = await loginSessionsCollection.find({
      loginTime: { $gte: startDate },
      role: { $in: ['operations', 'sales', 'credit'] }
    }).sort({ loginTime: -1 }).toArray();

    console.log('📊 Found login sessions:', loginSessions.length);

    // Calculate session durations and process sessions
    const processedSessions = loginSessions.map(session => {
      let sessionDuration = session.sessionDuration;
      
      if (session.status === 'logged_out' && session.logoutTime && !sessionDuration) {
        sessionDuration = Math.floor((new Date(session.logoutTime).getTime() - new Date(session.loginTime).getTime()) / (1000 * 60));
      } else if (session.status === 'active') {
        sessionDuration = Math.floor((now.getTime() - new Date(session.loginTime).getTime()) / (1000 * 60));
      }

      return {
        _id: session._id.toString(),
        userId: session.userId.toString(),
        username: session.username,
        fullName: session.fullName,
        role: session.role,
        department: session.department,
        branch: session.branch,
        loginTime: session.loginTime.toISOString(),
        logoutTime: session.logoutTime ? session.logoutTime.toISOString() : undefined,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        status: session.status,
        sessionDuration
      };
    });

    // Calculate statistics
    const calculateRoleStats = (role: string, totalUsers: number) => {
      const roleSessions = processedSessions.filter(s => s.role === role);
      const activeUsers = roleSessions.filter(s => s.status === 'active').length;
      const totalLogins = roleSessions.length;
      
      const completedSessions = roleSessions.filter(s => s.status === 'logged_out' && s.sessionDuration > 0);
      const avgSessionTime = completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / completedSessions.length)
        : 0;

      return {
        totalUsers,
        activeUsers,
        totalLogins,
        avgSessionTime
      };
    };

    const stats = {
      operations: calculateRoleStats('operations', operationsUsers),
      sales: calculateRoleStats('sales', salesUsers),
      credit: calculateRoleStats('credit', creditUsers)
    };

    console.log('📊 Calculated stats:', stats);
    console.log('📊 Returning', processedSessions.length, 'sessions');

    return NextResponse.json({
      success: true,
      sessions: processedSessions,
      stats: stats,
      dateRange: range,
      startDate: startDate.toISOString(),
      totalSessions: processedSessions.length
    });

  } catch (error) {
    console.error('❌ Error fetching login tracker data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch login tracker data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to log user login/logout events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, ipAddress, userAgent } = body;

    console.log('📊 Login Tracker API: Recording', action, 'for user:', userId);

    if (!action || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: action and userId' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const loginSessionsCollection = db.collection('login_sessions');

    // Get user details
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'login') {
      // Close any existing active sessions for this user (simplified approach)
      const activeSessions = await loginSessionsCollection.find({
        userId: userId,
        status: 'active'
      }).toArray();

      // Update existing active sessions to logged out
      for (const session of activeSessions) {
        const logoutTime = new Date();
        const sessionDuration = Math.floor((logoutTime.getTime() - session.loginTime.getTime()) / (1000 * 60));
        
        await loginSessionsCollection.updateOne(
          { _id: session._id },
          {
            $set: {
              status: 'logged_out',
              logoutTime: logoutTime,
              sessionDuration: sessionDuration
            }
          }
        );
      }

      // Create new login session
      const loginSession = {
        userId: userId,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        branch: user.branch,
        loginTime: new Date(),
        ipAddress: ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
        userAgent: userAgent || request.headers.get('user-agent') || 'Unknown',
        status: 'active',
        lastActivity: new Date()
      };

      const result = await loginSessionsCollection.insertOne(loginSession);
      
      // Update user's last login
      await usersCollection.updateOne(
        { _id: userId },
        { $set: { lastLogin: new Date() } }
      );

      console.log('✅ Login session created:', result.insertedId);

    } else if (action === 'logout') {
      // Update the active session to logged out
      const activeSession = await loginSessionsCollection.findOne({
        userId: userId,
        status: 'active'
      });

      if (activeSession) {
        const logoutTime = new Date();
        const sessionDuration = Math.floor((logoutTime.getTime() - activeSession.loginTime.getTime()) / (1000 * 60));

        await loginSessionsCollection.updateOne(
          { _id: activeSession._id },
          {
            $set: {
              status: 'logged_out',
              logoutTime: logoutTime,
              sessionDuration: sessionDuration
            }
          }
        );

        console.log('✅ Logout recorded for session:', activeSession._id, 'Duration:', sessionDuration, 'minutes');
      }
    } else if (action === 'heartbeat') {
      // Update last activity for active session
      await loginSessionsCollection.updateOne(
        { userId: userId, status: 'active' },
        { $set: { lastActivity: new Date() } }
      );
      
      console.log('💓 Heartbeat recorded for user:', userId);
    }

    return NextResponse.json({
      success: true,
      message: `${action} recorded successfully`
    });

  } catch (error) {
    console.error('❌ Error recording login/logout:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to record login/logout',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
