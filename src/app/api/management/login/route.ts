import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 MANAGEMENT LOGIN API - Starting authentication...');
    
    const body = await request.json();
    const { managementId, password } = body;

    if (!managementId || !password) {
      return NextResponse.json(
        { success: false, error: 'Management ID and password are required', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    console.log('🔍 MANAGEMENT CHECK - Starting check for:', managementId);

    // Check for specific admin credentials that can access management (HIGHEST PRIORITY)
    // This bypasses any database entries for the admin user
    if (managementId === 'AashishSrivastava2025' && 
        (password === 'Bizloan@2025' || password === 'AashishSrivastava2025')) {
      console.log('✅ Admin accessing management portal with hardcoded credentials - BYPASSING DATABASE');
      const adminToken = `mgt_admin_${Date.now()}`;
      return NextResponse.json({
        success: true,
        message: 'Admin management access successful',
        token: adminToken,
        user: {
          managementId: 'AashishSrivastava2025',
          employeeId: 'AashishSrivastava2025',
          name: 'Aashish Srivastava',
          email: 'admin@bizloanindia.com',
          role: 'management',
          permissions: ['approve_queries', 'approve_otc', 'approve_deferral', 'view_sales', 'view_credit', 'admin_access'],
          queryTeamPreferences: ['sales', 'credit', 'both'],
          loginTime: new Date().toISOString()
        }
      });
    }

    // Connect to database only after checking hardcoded admin credentials
    const { db } = await connectToDatabase();
    
    // Check management_users collection first
    console.log('🏢 Checking management_users collection...');
    const managementUser = await db.collection('management_users').findOne({
      $or: [
        { managementId: managementId },
        { employeeId: managementId }
      ]
    });

    if (managementUser) {
      console.log('✅ Found management user:', managementUser.name);
      console.log('🔍 Password comparison - Input:', password);
      console.log('🔍 Database password exists:', !!managementUser.password);
      console.log('🔍 Database password length:', managementUser.password?.length || 0);
      
      // Verify password (in production, use proper password hashing)
      const passwordMatch = managementUser.password === password || 
                           password === 'admin123' || // Default admin password
                           password === 'management2024' || // Default management password
                           password === 'Bizloan@2025'; // Admin password

      console.log('🔍 Password match result:', passwordMatch);

      if (!passwordMatch) {
        console.log('❌ Invalid password for management user');
        return NextResponse.json(
          { success: false, error: 'Invalid password', code: 'INVALID_PASSWORD' },
          { status: 401 }
        );
      }

      if (managementUser.isActive === false) {
        console.log('❌ Management account is inactive');
        return NextResponse.json(
          { success: false, error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' },
          { status: 403 }
        );
      }

      // Successful management login
      const userResponse = {
        managementId: managementUser.managementId || managementUser.employeeId,
        employeeId: managementUser.employeeId,
        name: managementUser.name,
        email: managementUser.email,
        role: 'management',
        permissions: managementUser.permissions || ['approve_queries', 'approve_otc', 'approve_deferral', 'view_sales', 'view_credit'],
        queryTeamPreferences: managementUser.queryTeamPreferences || ['sales', 'credit', 'both'],
        loginTime: new Date().toISOString()
      };

      console.log('✅ Management login successful for:', managementUser.name);
      
      // Generate token
      const managementToken = `mgt_${managementUser.managementId || managementUser.employeeId}_${Date.now()}`;
      
      return NextResponse.json({
        success: true,
        message: 'Management login successful',
        token: managementToken,
        user: userResponse
      });
    }

    // If not found in management_users, check regular users with management roles
    console.log('👤 Checking users collection for management roles...');
    const regularUser = await db.collection('users').findOne({
      $or: [
        { employeeId: managementId },
        { name: managementId }
      ]
    });

    if (regularUser && ['management', 'manager', 'supervisor'].includes(regularUser.role)) {
      console.log('✅ Found user with management role:', regularUser.name);
      
      // Verify password
      const passwordMatch = regularUser.password === password || 
                           password === 'admin123' || 
                           password === 'management2024' ||
                           password === 'Bizloan@2025'; // Admin password

      if (!passwordMatch) {
        console.log('❌ Invalid password for management user');
        return NextResponse.json(
          { success: false, error: 'Invalid password', code: 'INVALID_PASSWORD' },
          { status: 401 }
        );
      }

      if (regularUser.isActive === false) {
        console.log('❌ User account is inactive');
        return NextResponse.json(
          { success: false, error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' },
          { status: 403 }
        );
      }

      // Successful management login
      const userResponse = {
        managementId: regularUser.employeeId,
        employeeId: regularUser.employeeId,
        name: regularUser.name,
        email: regularUser.email,
        role: 'management',
        permissions: ['approve_queries', 'approve_otc', 'approve_deferral', 'view_sales', 'view_credit'],
        queryTeamPreferences: ['sales', 'credit', 'both'],
        loginTime: new Date().toISOString()
      };

      console.log('✅ Management login successful for:', regularUser.name);
      
      // Generate token
      const managementToken = `mgt_${regularUser.employeeId}_${Date.now()}`;
      
      return NextResponse.json({
        success: true,
        message: 'Management login successful',
        token: managementToken,
        user: userResponse
      });
    }

    // User not found or no management access
    console.log('❌ No management user found for ID:', managementId);
    return NextResponse.json(
      { success: false, error: 'Management user not found or access denied', code: 'USER_NOT_FOUND' },
      { status: 404 }
    );

  } catch (error) {
    console.error('❌ Management login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
