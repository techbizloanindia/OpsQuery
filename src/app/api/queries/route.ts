import { NextRequest, NextResponse } from 'next/server';

interface QueryData {
  id: number;
  appNo: string;
  queries: Array<{
    id: string;
    text: string;
    status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
    timestamp?: string;
    sender?: string;
    senderRole?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    resolutionReason?: string;
    lastUpdated?: string;
    assignedTo?: string;
    remarks?: string;
    revertedAt?: string;
    revertedBy?: string;
    revertReason?: string;
    isResolved?: boolean;
  }>;
  sendTo: string[];
  sendToSales: boolean;
  sendToCredit: boolean;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
  customerName: string;
  branch: string;
  branchCode: string;
  lastUpdated: string;
  markedForTeam?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
  isResolved?: boolean;
  assignedTo?: string;
  remarks?: string;
  revertedAt?: string;
  revertedBy?: string;
  revertReason?: string;
}

interface QuerySubmission {
  appNo: string;
  queries: string[];
  sendTo: string;
}

// In-memory storage for demo purposes
// In a real app, this would be stored in a database
const queriesDatabase: QueryData[] = [];

// Initialize sample data
function initializeSampleData() {
  if (queriesDatabase.length === 0) {
    const sampleQueries: (QueryData & { isResolved?: boolean })[] = [
      {
        id: 1001,
        appNo: 'GGN 12',
        queries: [
          {
            id: '1001-1',
            text: 'Please provide updated income documents for loan verification',
            status: 'pending',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Sales'],
        sendToSales: true,
        sendToCredit: false,
        submittedBy: 'Rajesh Kumar',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        customerName: 'Amit Sharma',
        branch: 'Gurgaon Branch',
        branchCode: 'GGN',
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        markedForTeam: 'sales'
      },
      {
        id: 1002,
        appNo: 'ALI 234',
        queries: [
          {
            id: '1002-1',
            text: 'Credit score verification required for final approval',
            status: 'pending',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Credit'],
        sendToSales: false,
        sendToCredit: true,
        submittedBy: 'Priya Singh',
        submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        customerName: 'Rahul Patel',
        branch: 'Aligarh Branch',
        branchCode: 'ALI',
        lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        markedForTeam: 'credit'
      },
      {
        id: 1003,
        appNo: 'JP 567',
        queries: [
          {
            id: '1003-1',
            text: 'Bank statement verification for the last 6 months required',
            status: 'pending',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Credit', 'Sales'],
        sendToSales: true,
        sendToCredit: true,
        submittedBy: 'Amit Verma',
        submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        customerName: 'Anjali Krishnan',
        branch: 'Jaipur Branch',
        branchCode: 'JP',
        lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        markedForTeam: 'both'
      },
      {
        id: 1004,
        appNo: 'MUM 456',
        queries: [
          {
            id: '1004-1',
            text: 'Customer contact verification and address proof validation',
            status: 'pending',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Sales'],
        sendToSales: true,
        sendToCredit: false,
        submittedBy: 'Neha Patel',
        submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        customerName: 'Sonia Mehra',
        branch: 'Mumbai Branch',
        branchCode: 'MUM',
        lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        markedForTeam: 'sales'
      },
      {
        id: 1005,
        appNo: 'BLR 789',
        queries: [
          {
            id: '1005-1',
            text: 'Employment verification and salary certificate authentication',
            status: 'pending',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Credit'],
        sendToSales: false,
        sendToCredit: true,
        submittedBy: 'Vikram Gupta',
        submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        customerName: 'Deepika Joshi',
        branch: 'Bangalore Branch',
        branchCode: 'BLR',
        lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        markedForTeam: 'credit'
      },
      {
        id: 1006,
        appNo: 'CHN 101',
        queries: [
          {
            id: '1006-1',
            text: 'Document verification required for final approval',
            status: 'pending',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Credit'],
        sendToSales: false,
        sendToCredit: true,
        submittedBy: 'Rohit Mehta',
        submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        customerName: 'Rohit Mehta',
        branch: 'Chennai Branch',
        branchCode: 'CHN',
        lastUpdated: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        markedForTeam: 'credit'
      },
      // Add some resolved queries for testing
      {
        id: 1007,
        appNo: 'PUN 111',
        queries: [
          {
            id: '1007-1',
            text: 'Loan disbursement approval required',
            status: 'approved',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Credit'],
        sendToSales: false,
        sendToCredit: true,
        submittedBy: 'Ankit Sharma',
        submittedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        status: 'approved',
        customerName: 'Priya Jain',
        branch: 'Pune Branch',
        branchCode: 'PUN',
        lastUpdated: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        resolvedBy: 'Credit Team',
        resolutionReason: 'approved',
        markedForTeam: 'credit',
        isResolved: true
      },
      {
        id: 1008,
        appNo: 'HYD 222',
        queries: [
          {
            id: '1008-1',
            text: 'Document verification deferred for additional papers',
            status: 'deferred',
            timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Sales'],
        sendToSales: true,
        sendToCredit: false,
        submittedBy: 'Rajesh Kumar',
        submittedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        status: 'deferred',
        customerName: 'Kavita Singh',
        branch: 'Hyderabad Branch',
        branchCode: 'HYD',
        lastUpdated: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
        resolvedBy: 'Sales Team',
        resolutionReason: 'deferral',
        markedForTeam: 'sales'
      },
      {
        id: 1009,
        appNo: 'KOL 333',
        queries: [
          {
            id: '1009-1',
            text: 'OTC process initiated for customer',
            status: 'otc',
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Credit', 'Sales'],
        sendToSales: true,
        sendToCredit: true,
        submittedBy: 'Meera Patel',
        submittedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        status: 'otc',
        customerName: 'Ravi Kumar',
        branch: 'Kolkata Branch',
        branchCode: 'KOL',
        lastUpdated: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        resolvedBy: 'Operations Team',
        resolutionReason: 'otc',
        markedForTeam: 'both'
      },
      // Add sample with multiple queries for the same application
      {
        id: 1010,
        appNo: 'DEL 444',
        queries: [
          {
            id: '1010-1',
            text: 'Income verification documents need to be validated',
            status: 'pending',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            sender: 'Operations Team',
            senderRole: 'operations'
          },
          {
            id: '1010-2',
            text: 'Credit score check required for final assessment',
            status: 'pending',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Sales', 'Credit'],
        sendToSales: true,
        sendToCredit: true,
        submittedBy: 'Arjun Patel',
        submittedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        status: 'pending',
        customerName: 'Rakesh Gupta',
        branch: 'Delhi Branch',
        branchCode: 'DEL',
        lastUpdated: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        markedForTeam: 'both'
      },
      // Add another sample with multiple queries for Sales only
      {
        id: 1011,
        appNo: 'BOM 555',
        queries: [
          {
            id: '1011-1',
            text: 'Customer contact verification required',
            status: 'pending',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
            sender: 'Operations Team',
            senderRole: 'operations'
          },
          {
            id: '1011-2',
            text: 'Address proof validation needed',
            status: 'pending',
            timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 minutes ago
            sender: 'Operations Team',
            senderRole: 'operations'
          },
          {
            id: '1011-3',
            text: 'Employment details confirmation',
            status: 'pending',
            timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
            sender: 'Operations Team',
            senderRole: 'operations'
          }
        ],
        sendTo: ['Sales'],
        sendToSales: true,
        sendToCredit: false,
        submittedBy: 'Suresh Kumar',
        submittedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        status: 'pending',
        customerName: 'Sunita Sharma',
        branch: 'Mumbai Branch',
        branchCode: 'BOM',
        lastUpdated: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        markedForTeam: 'sales'
      }
    ];
    
    queriesDatabase.push(...sampleQueries);
    console.log(`📊 Initialized ${sampleQueries.length} sample queries in database`);
  }
}

// POST - Submit new queries
export async function POST(request: NextRequest) {
  try {
    const body: QuerySubmission = await request.json();
    const { appNo, queries, sendTo } = body;
    
    if (!appNo || !queries || queries.length === 0 || !sendTo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: appNo, queries, sendTo' 
        },
        { status: 400 }
      );
    }

    // Validate queries are not empty
    const validQueries = queries.filter(q => q.trim().length > 0);
    if (validQueries.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one query must be provided' 
        },
        { status: 400 }
      );
    }

    // Parse teams from sendTo
    const teamsArray = sendTo.split(',').map(team => team.trim());
    const sendToSales = teamsArray.includes('Sales');
    const sendToCredit = teamsArray.includes('Credit');
    
    // Determine markedForTeam
    let markedForTeam = 'both';
    if (sendToSales && !sendToCredit) {
      markedForTeam = 'sales';
    } else if (sendToCredit && !sendToSales) {
      markedForTeam = 'credit';
    }
    
    // Fetch customer details from applications API
    let customerName = `Customer for ${appNo}`;
    let branch = 'Default Branch';
    let branchCode = 'DEF';
    
    try {
      const appResponse = await fetch(`${request.nextUrl.origin}/api/applications/${encodeURIComponent(appNo)}`);
      if (appResponse.ok) {
        const appResult = await appResponse.json();
        if (appResult.success && appResult.data) {
          customerName = appResult.data.customerName;
          branch = appResult.data.branchName || 'Default Branch';
          branchCode = appResult.data.branchName?.substring(0, 3).toUpperCase() || 'DEF';
        }
      }
    } catch (error) {
      console.log('Could not fetch application details, using defaults');
    }

    // Create query data with timestamp
    const queryData: QueryData = {
      id: Date.now(), // Simple ID generation for demo
      appNo,
      queries: validQueries.map((text, index) => ({
        id: `${Date.now()}-${index}`,
        text,
        status: 'pending' as const,
        timestamp: new Date().toISOString(),
        sender: 'Operations Team',
        senderRole: 'operations'
      })),
      sendTo: teamsArray,
      sendToSales,
      sendToCredit,
      submittedBy: 'Operations Team', // In a real app, get from auth context
      submittedAt: new Date().toISOString(),
      status: 'pending',
      customerName,
      branch,
      branchCode,
      lastUpdated: new Date().toISOString(),
      markedForTeam
    };

    // Store in our in-memory database
    queriesDatabase.push(queryData);
    
    console.log('📝 New query submitted:', queryData);

    return NextResponse.json({
      success: true,
      data: queryData,
      message: 'Query submitted successfully'
    });

  } catch (error: any) {
    console.error('Error submitting query:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve queries (for teams to see)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team'); // 'sales', 'credit', or 'all'
    const appNo = searchParams.get('appNo');
    const status = searchParams.get('status'); // 'pending', 'resolved', or 'all'
    const stats = searchParams.get('stats'); // 'true' to get statistics

    // Initialize sample data for demo
    try {
      initializeSampleData();
    } catch (initError) {
      console.error('Error initializing sample data:', initError);
      // Continue with empty database if initialization fails
    }

    // If stats parameter is provided, return query statistics
    if (stats === 'true') {
      try {
        const pendingQueries = queriesDatabase.filter(q => q.status === 'pending');
        const resolvedQueries = queriesDatabase.filter(q => 
          ['approved', 'deferred', 'otc', 'resolved'].includes(q.status)
        );
        const totalQueries = queriesDatabase.length;
        
        return NextResponse.json({
          success: true,
          data: {
            total: totalQueries,
            pending: pendingQueries.length,
            resolved: resolvedQueries.length,
            byStatus: {
              pending: pendingQueries.length,
              resolved: resolvedQueries.filter(q => q.status === 'resolved').length,
              approved: queriesDatabase.filter(q => q.status === 'approved').length,
              deferred: queriesDatabase.filter(q => q.status === 'deferred').length,
              otc: queriesDatabase.filter(q => q.status === 'otc').length
            },
            byTeam: {
              sales: queriesDatabase.filter(q => q.sendToSales).length,
              credit: queriesDatabase.filter(q => q.sendToCredit).length,
              both: queriesDatabase.filter(q => q.sendToSales && q.sendToCredit).length
            },
            timestamp: new Date().toISOString()
          }
        });
      } catch (statsError) {
        console.error('Error generating stats:', statsError);
        return NextResponse.json({
          success: true,
          data: {
            total: 0,
            pending: 0,
            resolved: 0,
            byStatus: { pending: 0, resolved: 0, approved: 0, deferred: 0, otc: 0 },
            byTeam: { sales: 0, credit: 0, both: 0 },
            timestamp: new Date().toISOString(),
            error: 'Stats generation failed'
          }
        });
      }
    }

    // Filter based on parameters
    let filteredQueries = [...queriesDatabase];

    try {
      // Filter by application number
      if (appNo) {
        filteredQueries = filteredQueries.filter(q => 
          q.appNo && q.appNo.toLowerCase().includes(appNo.toLowerCase())
        );
      }

      // Filter by status
      if (status && status !== 'all') {
        if (status === 'pending') {
          filteredQueries = filteredQueries.filter(q => 
            q.status === 'pending' && !(q as any).isResolved
          );
        } else if (status === 'resolved') {
          // Show queries that are resolved OR have status of approved/deferred/otc
          filteredQueries = filteredQueries.filter(q => 
            (q as any).isResolved === true || 
            ['approved', 'deferred', 'otc', 'resolved'].includes(q.status)
          );
        }
      }

      // Filter by team
      if (team && team !== 'all') {
        const teamLower = team.toLowerCase();
        
        if (teamLower === 'sales') {
          filteredQueries = filteredQueries.filter(q => 
            q.sendToSales || q.markedForTeam === 'sales' || q.markedForTeam === 'both'
          );
        } else if (teamLower === 'credit') {
          filteredQueries = filteredQueries.filter(q => 
            q.sendToCredit || q.markedForTeam === 'credit' || q.markedForTeam === 'both'
          );
        }
      }

      // Sort by last updated (newest first)
      filteredQueries.sort((a, b) => {
        const dateA = new Date(b.lastUpdated || b.submittedAt || 0).getTime();
        const dateB = new Date(a.lastUpdated || a.submittedAt || 0).getTime();
        return dateA - dateB;
      });
    } catch (filterError) {
      console.error('Error filtering queries:', filterError);
      // Return unfiltered data if filtering fails
      filteredQueries = [...queriesDatabase];
    }

    console.log(`📊 GET /api/queries - Found ${filteredQueries.length} queries for team: ${team}, status: ${status}, appNo: ${appNo}`);

    return NextResponse.json({
      success: true,
      data: filteredQueries,
      count: filteredQueries.length,
      filters: {
        team,
        status,
        appNo
      }
    });

  } catch (error: any) {
    console.error('Error in Queries API:', error);
    
    // Always return valid JSON, never throw HTML error pages
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch queries',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

// PATCH - Update query status based on actions taken
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      queryId, 
      status, 
      resolvedBy, 
      resolvedAt, 
      resolutionReason,
      assignedTo,
      remarks,
      revertedAt,
      revertedBy,
      revertReason,
      isResolved,
      isIndividualQuery
    } = body;
    
    if (!queryId || !status) {
      return NextResponse.json(
        { success: false, error: 'Query ID and status are required' },
        { status: 400 }
      );
    }

    console.log(`📝 Received PATCH request for query ${queryId} with status ${status}`, 
      revertedBy ? `- Reverted by ${revertedBy}` : '',
      isIndividualQuery ? '- Individual query update' : '- Main query update');

    // Initialize sample data if needed
    initializeSampleData();

    // Find the application containing this query
    let foundApplication = null;
    let queryToUpdate = null;
    
    // Search for the query in the database
    for (const app of queriesDatabase) {
      if (app.id === queryId) {
        // This is a main application query
        foundApplication = app;
        queryToUpdate = app;
        break;
      } else if (Array.isArray(app.queries)) {
        // Look for individual queries within this application
        const individualQuery = app.queries.find(q => q.id === queryId.toString() || q.id === queryId);
        if (individualQuery) {
          foundApplication = app;
          queryToUpdate = individualQuery;
          break;
        }
      }
    }
    
    if (!foundApplication) {
      console.warn(`⚠️ Query ${queryId} not found in database`);
      return NextResponse.json(
        { success: false, error: 'Query not found' },
        { status: 404 }
      );
    }

    // Update the specific query
    if (queryToUpdate) {
      // Update status and resolution fields
      queryToUpdate.status = status;
      queryToUpdate.lastUpdated = new Date().toISOString();
      
      // Handle resolution fields
      if (resolvedBy) queryToUpdate.resolvedBy = resolvedBy;
      if (resolvedAt) queryToUpdate.resolvedAt = resolvedAt;
      if (resolutionReason) queryToUpdate.resolutionReason = resolutionReason;
      if (assignedTo) (queryToUpdate as any).assignedTo = assignedTo;
      if (remarks) (queryToUpdate as any).remarks = remarks;
      
      // Handle revert fields
      if (revertedAt) (queryToUpdate as any).revertedAt = revertedAt;
      if (revertedBy) (queryToUpdate as any).revertedBy = revertedBy;
      if (revertReason) (queryToUpdate as any).revertReason = revertReason;
      
      // If reverted, clear resolution fields
      if (status === 'pending' && revertedBy) {
        queryToUpdate.resolvedAt = undefined;
        queryToUpdate.resolvedBy = undefined;
        queryToUpdate.resolutionReason = undefined;
        (queryToUpdate as any).isResolved = false;
      }

      console.log(`✅ Updated query ${queryId} status to ${status}`);
    }

    // For individual queries, check if we need to update the main application status
    if (queryToUpdate !== foundApplication && Array.isArray(foundApplication.queries)) {
      // This is an individual query - check if all queries in the application are resolved
      const allQueriesResolved = foundApplication.queries.every(q => 
        ['approved', 'deferred', 'otc', 'resolved'].includes(q.status)
      );
      
      // Determine if this action should move to resolved section
      const shouldMoveToResolved = ['approved', 'deferred', 'otc'].includes(status);
      
      if (shouldMoveToResolved) {
        // Mark this individual query as resolved
        (queryToUpdate as any).isResolved = true;
        console.log(`✅ Individual query ${queryId} moved to resolved section with ${status} status`);
      }
      
      if (allQueriesResolved) {
        // If all individual queries are resolved, mark the whole application as resolved
        foundApplication.status = 'resolved';
        foundApplication.resolvedAt = resolvedAt || new Date().toISOString();
        foundApplication.resolvedBy = resolvedBy || 'Operations Team';
        foundApplication.resolutionReason = 'All queries resolved';
        (foundApplication as any).isResolved = true;
        console.log(`✅ All queries for application ${foundApplication.appNo} are now resolved`);
      } else {
        // Keep main application as pending if not all queries are resolved
        foundApplication.status = 'pending';
        (foundApplication as any).isResolved = false;
        console.log(`ℹ️ Application ${foundApplication.appNo} still has pending queries`);
      }
      
      foundApplication.lastUpdated = new Date().toISOString();
    } else {
      // This is a main application query update
      const shouldMoveToResolved = ['approved', 'deferred', 'otc'].includes(status);
      (foundApplication as any).isResolved = shouldMoveToResolved;
      
      // Also update all individual queries to match
      if (Array.isArray(foundApplication.queries)) {
        foundApplication.queries.forEach(individualQuery => {
          individualQuery.status = status;
          
          if (resolvedBy) (individualQuery as any).resolvedBy = resolvedBy;
          if (resolvedAt) (individualQuery as any).resolvedAt = resolvedAt;
          if (resolutionReason) (individualQuery as any).resolutionReason = resolutionReason;
          
          if (revertedAt) (individualQuery as any).revertedAt = revertedAt;
          if (revertedBy) (individualQuery as any).revertedBy = revertedBy;
          if (revertReason) (individualQuery as any).revertReason = revertReason;
          
          if (status === 'pending' && revertedBy) {
            (individualQuery as any).resolvedAt = undefined;
            (individualQuery as any).resolvedBy = undefined;
            (individualQuery as any).resolutionReason = undefined;
          }
        });
      }
      
      console.log(`✅ Updated main application and all individual queries for ${foundApplication.appNo}`);
    }

    return NextResponse.json({
      success: true,
      data: foundApplication,
      message: 'Query updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating query:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
