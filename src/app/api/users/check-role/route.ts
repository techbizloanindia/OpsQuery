import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { ManagementModel } from '@/lib/models/Management';

// GET - Check user role by employee ID or management ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const managementId = searchParams.get('managementId');

    if (!employeeId && !managementId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Employee ID or Management ID is required' 
        },
        { status: 400 }
      );
    }

    // Check management users first if managementId is provided
    if (managementId) {
      try {
        const managementUser = await ManagementModel.getManagementUserById(managementId);
        
        if (managementUser && managementUser.isActive) {
          return NextResponse.json({
            success: true,
            data: {
              hasRole: true,
              role: 'management',
              fullName: managementUser.name,
              branch: 'Head Office',
              employeeId: managementUser.employeeId,
              managementId: managementUser.managementId,
              permissions: managementUser.permissions
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            data: {
              hasRole: false,
              role: null,
              message: 'Management user not found'
            }
          });
        }
      } catch (managementError) {
        console.log('Error checking management user by ID:', managementError);
        return NextResponse.json({
          success: true,
          data: {
            hasRole: false,
            role: null,
            message: 'Management user not found'
          }
        });
      }
    }

    // First check if this is a management user by employee ID
    if (employeeId) {
      try {
        const managementUser = await ManagementModel.getManagementUserByEmployeeId(employeeId);
        
        if (managementUser && managementUser.isActive) {
          return NextResponse.json({
            success: true,
            data: {
              hasRole: true,
              role: 'management',
              fullName: managementUser.name,
              branch: 'Head Office',
              employeeId: managementUser.employeeId,
              managementId: managementUser.managementId,
              permissions: managementUser.permissions
            }
          });
        }
      } catch (managementError) {
        console.log('Error checking management user:', managementError);
        // Continue to regular user check
      }
    }

    // Find regular user by employee ID (only if employeeId is provided)
    if (!employeeId) {
      return NextResponse.json({
        success: true,
        data: {
          hasRole: false,
          role: null,
          message: 'User not found'
        }
      });
    }

    const user = await UserModel.getUserByEmployeeId(employeeId);
    
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          hasRole: false,
          role: null,
          message: 'User not found'
        }
      });
    }

    // Simplified logic: Check if user is marked for access
    // User has access if:
    // 1. User exists and is active
    // 2. User has a valid role assigned (operations, sales, credit, admin)
    // 3. User is not explicitly marked as inactive
    const validRoles = ['operations', 'sales', 'credit', 'admin'];
    const isActiveUser = user.isActive !== false; // Default to true if not specified
    const hasValidRole = user.role && validRoles.includes(user.role);
    const hasAccessRights = isActiveUser && hasValidRole;

    console.log(`🔍 Role check for ${employeeId}:`, {
      role: user.role,
      isActive: isActiveUser,
      hasValidRole,
      hasAccessRights,
      branch: user.branch
    });

    return NextResponse.json({
      success: true,
      data: {
        hasRole: hasAccessRights,
        role: hasAccessRights ? user.role : null,
        fullName: user.fullName,
        branch: user.branch,
        branchCode: user.branchCode,
        employeeId: user.employeeId,
        isActive: isActiveUser
      }
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check user role' 
      },
      { status: 500 }
    );
  }
} 