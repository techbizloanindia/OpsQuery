import { NextRequest, NextResponse } from 'next/server';

// Query interface for proper typing
interface QueryData {
  id: string;
  appNo: string;
  customerName: string;
  branch: string;
  queries: Array<{
    id: string;
    text: string;
    status: 'pending' | 'resolved' | 'approved' | 'deferred' | 'otc';
  }>;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'resolved' | 'approved' | 'deferred' | 'otc';
  sendTo: string[];
  markedForTeam: string;
  allowMessaging: boolean;
  priority: 'high' | 'medium' | 'low';
}

// In-memory database - should be replaced with database in production
let queriesDatabase: QueryData[] = [];

// Initialize data if empty
const initializeData = () => {
  if (queriesDatabase.length === 0) {
    queriesDatabase = [
      // No sample applications - clean database for production use
    ];
  }
};

// GET - Get specific query details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    initializeData();
    
    const { queryId } = await params;
    
    console.log(`🔍 Fetching query details for ID: ${queryId}`);
    
    // Find the specific query
    const query = queriesDatabase.find(q => q.id === queryId);
    
    if (!query) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Query with ID ${queryId} not found` 
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ Found query: ${query.appNo} - ${query.customerName}`);
    
    return NextResponse.json({
      success: true,
      data: query
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('💥 Error fetching query details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch query details: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

// PATCH - Update query status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await params;
    const body = await request.json();
    const { status, remarks } = body;
    
    if (!status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Status is required' 
        },
        { status: 400 }
      );
    }
    
    // Find and update the query
    const queryIndex = queriesDatabase.findIndex(q => q.id === queryId);
    
    if (queryIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Query with ID ${queryId} not found` 
        },
        { status: 404 }
      );
    }
    
    // Update the query
    queriesDatabase[queryIndex] = {
      ...queriesDatabase[queryIndex],
      status,
      lastUpdated: new Date().toISOString(),
      ...(remarks && { remarks })
    };
    
    console.log(`✅ Updated query ${queryId} status to: ${status}`);
    
    return NextResponse.json({
      success: true,
      data: queriesDatabase[queryIndex],
      message: `Query status updated to ${status}`
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('💥 Error updating query:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to update query: ${errorMessage}`
      },
      { status: 500 }
    );
  }
} 