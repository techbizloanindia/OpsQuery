import { NextRequest, NextResponse } from 'next/server';
import { ManagementModel, CreateManagementUserData } from '@/lib/models/Management';

export async function GET() {
  try {
    const managementUsers = await ManagementModel.getAllManagementUsers();
    return NextResponse.json({ managementUsers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching management users:', error);
    return NextResponse.json({ error: 'Failed to fetch management users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { managementId, employeeId, name, email, role, password, permissions, queryTeamPreferences } = body;

    // Validate required fields
    if (!managementId || !employeeId || !name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: managementId, employeeId, name, email, role, password' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'management') {
      return NextResponse.json(
        { error: 'Invalid role. Must be: management' },
        { status: 400 }
      );
    }

    const userData: CreateManagementUserData = {
      managementId,
      employeeId,
      name,
      email,
      role,
      password,
      permissions: permissions || [],
      queryTeamPreferences: queryTeamPreferences || []
    };

    const newUser = await ManagementModel.createManagementUser(userData);

    return NextResponse.json(
      { 
        message: 'Management user created successfully', 
        managementUser: newUser 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating management user:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Employee ID') && error.message.includes('already associated')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes('Management ID') && error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to create management user' }, { status: 500 });
  }
}
