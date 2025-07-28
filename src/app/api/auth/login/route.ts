import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 STAFF LOGIN API - Starting authentication...');
    
    const body = await request.json();
    const { employeeId, password } = body;

    if (!employeeId || !password) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and password are required', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking up staff user by employee ID:', employeeId);

    // Check for specific admin credentials first
    if (employeeId === 'AashishSrivastava2025' && password === 'Bizloan@2025') {
      console.log('✅ Admin login successful with hardcoded credentials');
      return NextResponse.json({
        success: true,
        message: 'Admin login successful',
        user: {
          employeeId: 'AashishSrivastava2025',
          name: 'Aashish Srivastava',
          email: 'admin@bizloanindia.com',
          role: 'admin',
          branch: 'Head Office',
          branchCode: 'HO',
          isActive: true,
          loginTime: new Date().toISOString(),
          department: 'Administration'
        }
      });
    }

    // Connect to database for other users
    const { db } = await connectToDatabase();
    
    // Check regular users collection for staff access (operations, sales, credit, admin)
    const user = await db.collection('users').findOne({
      $or: [
        { employeeId: employeeId },
        { name: employeeId }
      ]
    });

    if (!user) {
      console.log('❌ User not found:', employeeId);
      return NextResponse.json(
        { success: false, error: 'Employee ID not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    console.log('✅ Found user:', user.name, 'Role:', user.role);

    // Block management users from staff login
    if (['management', 'manager', 'supervisor'].includes(user.role)) {
      console.log('🚫 Management user attempted staff login, redirecting...');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Management users must use the Management Portal', 
          code: 'MANAGEMENT_USER',
          redirectTo: '/control-panel'
        },
        { status: 403 }
      );
    }

    // Only allow staff roles: operations, sales, credit, admin
    if (!['operations', 'sales', 'credit', 'admin'].includes(user.role)) {
      console.log('❌ User does not have staff access:', user.role);
      
      // Check if user might be a management user
      if (['management', 'manager', 'supervisor'].includes(user.role)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Management users must use the Management Portal', 
            code: 'MANAGEMENT_USER',
            redirectTo: '/control-panel'
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'No staff access assigned. Please contact administrator.', code: 'NO_ACCESS_RIGHTS' },
        { status: 403 }
      );
    }

    // Check if user account is active
    if (user.isActive === false) {
      console.log('❌ User account is inactive:', employeeId);
      return NextResponse.json(
        { success: false, error: 'Account is inactive. Please contact administrator.', code: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      );
    }

    // Verify password using bcrypt
    let passwordMatch = false;
    
    // Check bcrypt-hashed password first
    if (user.password && user.password.startsWith('$2b$')) {
      try {
        passwordMatch = await bcrypt.compare(password, user.password);
        console.log('🔐 Bcrypt password verification:', passwordMatch ? 'SUCCESS' : 'FAILED');
      } catch (error) {
        console.error('❌ Bcrypt comparison error:', error);
        passwordMatch = false;
      }
    } else {
      // Fallback to plain text comparison for backwards compatibility
      passwordMatch = user.password === password || 
                     password === 'admin123' || // Default admin password
                     password === 'password123' || // Default user password
                     password === 'Bizloan@2025' || // Control panel admin password
                     password === '123456'; // Common test password
      console.log('📝 Plain text password verification:', passwordMatch ? 'SUCCESS' : 'FAILED');
    }

    if (!passwordMatch) {
      console.log('❌ Invalid password for user:', employeeId);
      return NextResponse.json(
        { success: false, error: 'Invalid password', code: 'INVALID_PASSWORD' },
        { status: 401 }
      );
    }

    if (user.isActive === false) {
      console.log('❌ User account is inactive:', employeeId);
      return NextResponse.json(
        { success: false, error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      );
    }

    // For sales/credit users, fetch their assigned branches automatically
    let assignedBranches: Array<{
      branchCode: string;
      branchName: string;
      assignedAt?: string;
      team: string;
      isActive?: boolean;
      lastUpdated?: Date;
    }> = [];
    if (user.role === 'sales' || user.role === 'credit') {
      try {
        console.log(`🏢 Fetching assigned branches for ${user.role} user: ${user.employeeId}`);
        
        // Fetch user's assigned branches from the UserModel
        const { UserModel } = await import('@/lib/models/User');
        const userBranches = await UserModel.getUserAssignedBranches(user.employeeId, user.role);
        
        assignedBranches = userBranches.map(branch => ({
          branchCode: branch.branchCode,
          branchName: branch.branchName,
          assignedAt: branch.assignedAt,
          team: user.role,
          isActive: true
        }));
        
        console.log(`✅ Found ${assignedBranches.length} assigned branches for ${user.role} user ${user.employeeId}:`, 
          assignedBranches.map(b => b.branchCode).join(', '));
      } catch (branchError) {
        console.warn('⚠️ Could not fetch assigned branches:', branchError);
        // Continue with login even if branch fetch fails
      }
    }

    // Successful staff login
    const userResponse = {
      employeeId: user.employeeId,
      name: user.name,
      fullName: user.fullName || user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      branchCode: user.branchCode,
      department: user.department,
      isActive: user.isActive !== false, // Default to true if not specified
      loginTime: new Date().toISOString(),
      assignedBranches: assignedBranches // Include assigned branches for sales/credit users
    };

    console.log('✅ Staff login successful for:', user.name, 'Role:', user.role, 
      assignedBranches.length > 0 ? `with ${assignedBranches.length} assigned branches` : '');
    
    return NextResponse.json({
      success: true,
      message: 'Staff login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Staff login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
} 