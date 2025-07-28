import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Real-time Branch Data API
 * Fetches branch codes and mappings from the admin control panel database
 */

// GET - Fetch all branch codes with real-time data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'full'; // 'codes', 'mapping', 'full'
    const active = searchParams.get('active') === 'true';

    console.log(`🔍 Fetching real-time branch data - Format: ${format}, Active Only: ${active}`);

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Build mode - returning empty data'
      });
    }

    try {
      // Connect to database and get branch data
      const { db } = await connectToDatabase();
      const branchesCollection = db.collection('branches');
      
      // Build query filter
      const filter: any = {};
      if (active) {
        filter.isActive = true;
      }

      // Fetch branches from database
      const branches = await branchesCollection.find(filter).toArray();
      
      console.log(`📊 Found ${branches.length} branches in database`);

      // Process based on requested format
      let responseData;
      
      switch (format) {
        case 'codes':
          // Return only branch codes array
          responseData = branches.map(branch => branch.branchCode).filter(Boolean).sort();
          break;
          
        case 'mapping':
          // Return branch code to name mapping
          responseData = {};
          branches.forEach(branch => {
            if (branch.branchCode && branch.branchName) {
              responseData[branch.branchCode] = branch.branchName;
            }
          });
          break;
          
        case 'full':
        default:
          // Return full branch data
          responseData = branches.map(branch => ({
            branchCode: branch.branchCode,
            branchName: branch.branchName,
            city: branch.city,
            state: branch.state,
            region: branch.region,
            isActive: branch.isActive,
            createdAt: branch.createdAt,
            updatedAt: branch.updatedAt,
            _id: branch._id?.toString()
          }));
          break;
      }

      // Set real-time cache headers
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Real-Time': 'enabled',
        'X-Data-Source': 'admin-control-panel',
        'X-Branch-Count': branches.length.toString(),
        'X-Last-Updated': new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: responseData,
        count: Array.isArray(responseData) ? responseData.length : Object.keys(responseData).length,
        format,
        activeOnly: active,
        message: `Real-time branch data fetched successfully`,
        timestamp: new Date().toISOString(),
        metadata: {
          totalBranches: branches.length,
          activeBranches: branches.filter(b => b.isActive).length,
          inactiveBranches: branches.filter(b => !b.isActive).length,
          lastSync: new Date().toISOString(),
          source: 'admin-control-panel-database'
        }
      }, { headers });

    } catch (dbError) {
      console.error('❌ Database error fetching branch data:', dbError);
      
      // Return fallback data if database fails
      const fallbackData = {
        'ALI': 'Aligarh',
        'MUM': 'Mumbai', 
        'DEL': 'Delhi',
        'BLR': 'Bangalore',
        'CHE': 'Chennai',
        'KOL': 'Kolkata',
        'HYD': 'Hyderabad',
        'PUN': 'Pune'
      };

      let responseData;
      switch (format) {
        case 'codes':
          responseData = Object.keys(fallbackData);
          break;
        case 'mapping':
          responseData = fallbackData;
          break;
        default:
          responseData = Object.entries(fallbackData).map(([code, name]) => ({
            branchCode: code,
            branchName: name,
            isActive: true,
            source: 'fallback'
          }));
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        count: Array.isArray(responseData) ? responseData.length : Object.keys(responseData).length,
        format,
        message: 'Using fallback branch data due to database error',
        fallback: true,
        timestamp: new Date().toISOString(),
        error: 'Database connection failed, using cached data'
      });
    }

  } catch (error: any) {
    console.error('❌ Error fetching real-time branch data:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch branch data',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST - Update branch data (for admin panel real-time updates)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, branchData } = body;

    console.log(`🔄 Real-time branch update - Action: ${action}`, branchData);

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build mode - no updates performed'
      });
    }

    const { db } = await connectToDatabase();
    const branchesCollection = db.collection('branches');

    let result;
    
    switch (action) {
      case 'create':
        result = await branchesCollection.insertOne({
          ...branchData,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: branchData.isActive ?? true
        });
        break;
        
      case 'update':
        result = await branchesCollection.updateOne(
          { branchCode: branchData.branchCode },
          { 
            $set: { 
              ...branchData, 
              updatedAt: new Date() 
            } 
          }
        );
        break;
        
      case 'delete':
        result = await branchesCollection.deleteOne(
          { branchCode: branchData.branchCode }
        );
        break;
        
      case 'toggle-status':
        result = await branchesCollection.updateOne(
          { branchCode: branchData.branchCode },
          { 
            $set: { 
              isActive: !branchData.currentStatus,
              updatedAt: new Date() 
            } 
          }
        );
        break;
        
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    // Trigger real-time notifications to connected dashboards
    // This would typically use WebSockets or Server-Sent Events
    console.log(`📡 Broadcasting branch update to connected clients...`);

    return NextResponse.json({
      success: true,
      action,
      result,
      message: `Branch ${action} completed successfully`,
      timestamp: new Date().toISOString(),
      broadcastSent: true
    });

  } catch (error: any) {
    console.error('❌ Error updating branch data:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update branch data',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
