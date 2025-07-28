import { NextRequest, NextResponse } from 'next/server';

interface LoginSession {
  id: string;
  userId: string;
  userType: 'sales' | 'credit' | 'management' | 'operations';
  loginTime: string;
  logoutTime?: string;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory login tracker (replace with database in production)
const loginSessions: LoginSession[] = [];

// GET - Retrieve login tracker data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const active = searchParams.get('active');
    
    let filteredSessions = loginSessions;
    
    // Filter by user type if specified
    if (userType) {
      filteredSessions = filteredSessions.filter(session => 
        session.userType === userType
      );
    }
    
    // Filter by active status if specified
    if (active !== null) {
      const isActive = active === 'true';
      filteredSessions = filteredSessions.filter(session => 
        session.isActive === isActive
      );
    }
    
    return NextResponse.json({
      success: true,
      data: filteredSessions,
      count: filteredSessions.length
    });
  } catch (error) {
    console.error('Error retrieving login sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve login sessions' },
      { status: 500 }
    );
  }
}

// POST - Record new login session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userType, ipAddress, userAgent } = body;
    
    if (!userId || !userType) {
      return NextResponse.json(
        { success: false, error: 'User ID and user type are required' },
        { status: 400 }
      );
    }
    
    const session: LoginSession = {
      id: `session_${Date.now()}`,
      userId,
      userType,
      loginTime: new Date().toISOString(),
      isActive: true,
      ipAddress,
      userAgent
    };
    
    loginSessions.push(session);
    
    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error recording login session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record login session' },
      { status: 500 }
    );
  }
}

// PATCH - Update login session (logout)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, action } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const sessionIndex = loginSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    if (action === 'logout') {
      loginSessions[sessionIndex].logoutTime = new Date().toISOString();
      loginSessions[sessionIndex].isActive = false;
    }
    
    return NextResponse.json({
      success: true,
      data: loginSessions[sessionIndex]
    });
  } catch (error) {
    console.error('Error updating login session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update login session' },
      { status: 500 }
    );
  }
}
