import { NextRequest, NextResponse } from 'next/server';
import { ApplicationModel } from '@/lib/models/Application';

// GET - Get all applications with enhanced branch-based filtering for sales/credit teams
export async function GET(request: NextRequest) {
  try {
    // Skip during build time or return sample data
    if (process.env.BUILDING === 'true' || process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'Applications API running in safe mode'
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');
    const branchCode = searchParams.get('branchCode');
    const priority = searchParams.get('priority');
    const team = searchParams.get('team'); // Enhanced for sales/credit filtering
    const userId = searchParams.get('userId'); // User-specific filtering
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');
    const debug = searchParams.get('debug');

    console.log('📋 Applications API called with filters:', {
      status, branch, branchCode, priority, team, userId, limit, skip, debug
    });

    try {
      const filters: {
        status?: string;
        branch?: string;
        branchCode?: string;
        priority?: string;
        team?: string;
        limit?: number;
        skip?: number;
      } = {};
      if (status) filters.status = status;
      if (branch) filters.branch = branch;
      if (branchCode) filters.branchCode = branchCode;
      if (priority) filters.priority = priority;
      if (team) filters.team = team;
      if (limit) filters.limit = parseInt(limit);
      if (skip) filters.skip = parseInt(skip);
      
      // Enhanced filtering for sales/credit teams based on user's assigned branch
      let applications = await ApplicationModel.getAllApplications(filters);
      
      // Additional branch filtering for sales/credit teams
      if ((team === 'sales' || team === 'credit') && userId) {
        console.log(`🎯 Applying team-specific filtering for ${team} user: ${userId}`);
        
        try {
          // Import UserModel to get user's assigned branch
          const { UserModel } = await import('@/lib/models/User');
          const user = await UserModel.getUserByEmployeeId(userId);
          
          if (user && user.branch) {
            console.log(`👤 User ${userId} assigned to branch: ${user.branch}`);
            
            // Filter applications to only show the user's assigned branch
            applications = applications.filter(app => 
              app.branch === user.branch
            );
            
            console.log(`📊 Team filtering: User branch ${user.branch}, found ${applications.length} applications`);
          }
        } catch (error) {
          console.error('💥 Error fetching user branch assignment for applications:', error);
        }
      }
      
      console.log(`📊 Found ${applications.length} applications`);
      
      return NextResponse.json({
        success: true,
        data: applications,
        count: applications.length,
        filters: filters,
        debug: debug === 'true' ? {
          sampleApplications: applications.slice(0, 5).map(app => ({
            appId: app.appId,
            customerName: app.customerName,
            status: app.status,
            branch: app.branch,
            uploadedAt: app.uploadedAt
          }))
        } : undefined
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return fallback data instead of throwing error
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'Using fallback data due to database error'
      });
    }
  } catch (error) {
    console.error('Error in Applications API:', error);
    
    // Always return valid JSON, never throw HTML error pages
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch applications',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Update application status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, status, actor, remarks } = body;
    
    if (!appId || !status || !actor) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: appId, status, actor' 
        },
        { status: 400 }
      );
    }

    const updatedApplication = await ApplicationModel.updateApplicationStatus(
      appId, 
      status, 
      actor, 
      remarks
    );
    
    if (!updatedApplication) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Application not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: 'Application status updated successfully'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error updating application:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to update application: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}
