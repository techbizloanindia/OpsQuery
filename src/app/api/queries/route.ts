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
    markedFor?: string;
    awaitingApproval?: boolean;
    approvalType?: 'General' | 'OTC' | 'Deferral';
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

// In-memory storage - should be replaced with database in production
const queriesDatabase: QueryData[] = [];

// Generate branch-specific app numbers
function generateAppNumber(branchCode: string, sequenceNumber: number): string {
  return `${branchCode}${String(sequenceNumber).padStart(4, '0')}`;
}

// Initialize data with branch-specific queries
function initializeData() {
  if (queriesDatabase.length === 0) {
    // No sample queries - clean database for production use
    console.log(`📊 Initialized clean queries database for production`);
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
    
    console.log(`📋 Team Assignment Analysis:`);
    console.log(`   Teams Array: [${teamsArray.join(', ')}]`);
    console.log(`   Send to Sales: ${sendToSales}`);
    console.log(`   Send to Credit: ${sendToCredit}`);
    console.log(`   Marked for Team: ${markedForTeam}`);
    
    // Fetch customer details from applications API with real-time branch code mapping
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
          
          // Try to get real-time branch code mapping from admin control panel
          try {
            const branchMappingResponse = await fetch(`${request.nextUrl.origin}/api/branches/real-time?format=mapping&active=true`);
            if (branchMappingResponse.ok) {
              const branchMappingResult = await branchMappingResponse.json();
              if (branchMappingResult.success && branchMappingResult.data) {
                const branchMapping = branchMappingResult.data;
                
                // Look for exact branch name match first
                const exactMatch = Object.entries(branchMapping).find(([code, name]) => 
                  name === appResult.data.branchName
                );
                
                if (exactMatch) {
                  branchCode = exactMatch[0];
                  console.log(`✅ Exact branch mapping: "${appResult.data.branchName}" → "${branchCode}"`);
                } else {
                  // Try partial matching
                  const partialMatch = Object.entries(branchMapping).find(([code, name]) => 
                    appResult.data.branchName?.toLowerCase().includes((name as string).toLowerCase()) ||
                    (name as string).toLowerCase().includes(appResult.data.branchName?.toLowerCase() || '')
                  );
                  
                  if (partialMatch) {
                    branchCode = partialMatch[0];
                    console.log(`✅ Partial branch mapping: "${appResult.data.branchName}" → "${branchCode}" (matched: ${partialMatch[1]})`);
                  } else {
                    // Fallback to first 3 characters
                    branchCode = appResult.data.branchName?.substring(0, 3).toUpperCase() || 'DEF';
                    console.warn(`⚠️ No branch mapping found for "${appResult.data.branchName}", using fallback: "${branchCode}"`);
                  }
                }
              }
            } else {
              console.warn('⚠️ Failed to fetch real-time branch mapping, using fallback');
              branchCode = appResult.data.branchName?.substring(0, 3).toUpperCase() || 'DEF';
            }
          } catch (mappingError) {
            console.error('❌ Error fetching branch mapping:', mappingError);
            branchCode = appResult.data.branchName?.substring(0, 3).toUpperCase() || 'DEF';
          }
        }
      }
    } catch (error) {
      console.error('❌ Could not fetch application details:', error);
      console.log('Using default values for customer and branch information');
    }

    // Create query data with timestamp
    const queryData: QueryData = {
              id: Date.now(), // Simple ID generation
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

// GET - Retrieve queries with optional filters
export async function GET(request: NextRequest) {
  initializeData();
  
  try {
    const { searchParams } = new URL(request.url);
    const awaitingApproval = searchParams.get('awaiting_approval');
    const appNo = searchParams.get('appNo');
    const status = searchParams.get('status');
    const team = searchParams.get('team');
    const branch = searchParams.get('branch');
    const branchCode = searchParams.get('branchCode');
    const branches = searchParams.get('branches'); // New: comma-separated branch codes
    const stats = searchParams.get('stats') === 'true';
    
    // Handle management dashboard statistics request
    if (stats && team === 'management') {
      const allQueries = [...queriesDatabase];
      
      // Count queries by status for management dashboard
      const pendingCount = allQueries.filter(q => 
        q.status === 'pending' || 
        q.queries.some(query => query.status === 'pending' && query.awaitingApproval)
      ).length;
      
      const approvedCount = allQueries.filter(q => 
        q.status === 'approved' || 
        q.queries.some(query => query.status === 'approved')
      ).length;
      
      const otcCount = allQueries.filter(q => 
        q.status === 'otc' || 
        q.queries.some(query => query.status === 'otc')
      ).length;
      
      const deferralCount = allQueries.filter(q => 
        q.status === 'deferred' || 
        q.queries.some(query => query.status === 'deferred')
      ).length;
      
      const totalCount = allQueries.length;
      
      const managementStats = {
        pending: pendingCount,
        approved: approvedCount,
        otc: otcCount,
        deferral: deferralCount,
        total: totalCount
      };
      
      console.log('📊 Management dashboard stats:', managementStats);
      
      return NextResponse.json({
        success: true,
        data: managementStats,
        message: 'Management statistics retrieved successfully'
      });
    }
    
    let filteredQueries = [...queriesDatabase];
    
    // Filter by application number
    if (appNo) {
      filteredQueries = filteredQueries.filter(q => 
        q.appNo.toLowerCase().includes(appNo.toLowerCase())
      );
    }
    
    // Filter by status
    if (status) {
      filteredQueries = filteredQueries.filter(q => q.status === status);
    }
    
    // Filter by multiple branches (comma-separated branch codes) - Real-time from admin panel
    if (branches) {
      const branchCodeList = branches.split(',')
        .map(code => code.trim().toUpperCase())
        .filter(code => code.length > 0);
        
      if (branchCodeList.length > 0) {
        const beforeBranchFilter = filteredQueries.length;
        filteredQueries = filteredQueries.filter(q => {
          // Match branch codes (case-insensitive)
          const matches = branchCodeList.includes(q.branchCode.toUpperCase());
          
          if (matches) {
            console.log(`✅ Branch match: ${q.appNo} - Branch: ${q.branchCode} matches assigned branches`);
          } else {
            console.log(`❌ Branch mismatch: ${q.appNo} - Branch: ${q.branchCode} not in [${branchCodeList.join(', ')}]`);
          }
          
          return matches;
        });
        
        console.log(`🏢 Real-time branch filter applied: [${branchCodeList.join(', ')}] - ${beforeBranchFilter} → ${filteredQueries.length} queries`);
        
        // If no queries match any assigned branches, log this for debugging
        if (filteredQueries.length === 0 && beforeBranchFilter > 0) {
          console.warn(`⚠️ No queries found for assigned branches: ${branchCodeList.join(', ')}`);
          console.log(`📋 Available branch codes in database:`, 
            [...new Set(queriesDatabase.map(q => q.branchCode))].sort().join(', '));
        }
      } else {
        console.warn(`⚠️ No valid branch codes found in branches parameter: "${branches}"`);
      }
    }
    
    // Filter by single branch - Real-time branch code matching from admin panel
    else if (branch || branchCode) {
      const beforeSingleBranchFilter = filteredQueries.length;
      
      filteredQueries = filteredQueries.filter(q => {
        if (branch && branchCode) {
          const matches = q.branch === branch || q.branchCode.toUpperCase() === branchCode.toUpperCase();
          
          if (matches) {
            console.log(`✅ Single branch match: ${q.appNo} - Branch: ${q.branchCode} matches filter`);
          }
          
          return matches;
        } else if (branch) {
          return q.branch === branch;
        } else if (branchCode) {
          const matches = q.branchCode.toUpperCase() === branchCode.toUpperCase();
          
          if (matches) {
            console.log(`✅ Branch code match: ${q.appNo} - Code: ${q.branchCode} matches ${branchCode}`);
          }
          
          return matches;
        }
        return true;
      });
      
      console.log(`🏢 Single branch filter applied: ${beforeSingleBranchFilter} → ${filteredQueries.length} queries`);
    }
    
    // Filter by team - Enhanced for sales/credit with proper branch association
    if (team) {
      const beforeFilterCount = filteredQueries.length;
      
      if (team === 'sales') {
        filteredQueries = filteredQueries.filter(q => {
          // Show queries marked for sales or both teams
          const isForSalesTeam = q.sendToSales || q.markedForTeam === 'sales' || q.markedForTeam === 'both';
          if (isForSalesTeam) {
            console.log(`✅ Sales query included: ${q.appNo} (markedForTeam: ${q.markedForTeam}, sendToSales: ${q.sendToSales})`);
          } else {
            console.log(`❌ Sales query excluded: ${q.appNo} (markedForTeam: ${q.markedForTeam}, sendToSales: ${q.sendToSales})`);
          }
          return isForSalesTeam;
        });
      } else if (team === 'credit') {
        filteredQueries = filteredQueries.filter(q => {
          // Show queries marked for credit or both teams
          const isForCreditTeam = q.sendToCredit || q.markedForTeam === 'credit' || q.markedForTeam === 'both';
          if (isForCreditTeam) {
            console.log(`✅ Credit query included: ${q.appNo} (markedForTeam: ${q.markedForTeam}, sendToCredit: ${q.sendToCredit})`);
          } else {
            console.log(`❌ Credit query excluded: ${q.appNo} (markedForTeam: ${q.markedForTeam}, sendToCredit: ${q.sendToCredit})`);
          }
          return isForCreditTeam;
        });
      } else if (team === 'management') {
        // Management can see ALL operation queries without any marking filter
        // No filtering needed - they see everything from operations team
        console.log(`📋 Management query access: Showing all ${filteredQueries.length} operation queries without marking filter`);
      } else if (team === 'operations') {
        // Operations can see all queries
        // No additional filtering needed
      }
      
      console.log(`🎯 Team filter applied: ${team}, ${beforeFilterCount} → ${filteredQueries.length} queries`);
    }

    // Filter for queries awaiting approval
    if (awaitingApproval === 'true') {
      filteredQueries = filteredQueries.filter(q => 
        q.queries.some(query => 
          query.status === 'pending' && 
          (query.markedFor === 'approval' || query.awaitingApproval === true)
        )
      );
      
      // Add mock approval data for demonstration
      filteredQueries.forEach(q => {
        q.queries.forEach(query => {
          if (query.status === 'pending') {
            query.awaitingApproval = true;
            // Randomly assign approval types for demo
            const approvalTypes = ['General', 'OTC', 'Deferral'];
            query.approvalType = approvalTypes[Math.floor(Math.random() * approvalTypes.length)] as 'General' | 'OTC' | 'Deferral';
          }
        });
      });
    }
    
    console.log(`📊 Query retrieval summary:`);
    console.log(`   Total queries in database: ${queriesDatabase.length}`);
    console.log(`   Filtered queries returned: ${filteredQueries.length}`);
    console.log(`   Filters applied:`, {
      team: team || 'none',
      branches: branches || 'none',
      branchCode: branchCode || 'none',
      status: status || 'none',
      appNo: appNo || 'none'
    });
    
    return NextResponse.json({
      success: true,
      data: filteredQueries,
      count: filteredQueries.length,
      metadata: {
        totalInDatabase: queriesDatabase.length,
        filtersApplied: {
          team: team || null,
          branches: branches || null,
          branchCode: branchCode || null,
          status: status || null,
          appNo: appNo || null
        },
        timestamp: new Date().toISOString()
      }
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Total-Queries': queriesDatabase.length.toString(),
        'X-Filtered-Count': filteredQueries.length.toString()
      }
    });
  } catch (error) {
    console.error('❌ Error retrieving queries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve queries' },
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
    initializeData();

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
      
      // Set resolutionType based on status for OTC and Deferral queries
      if (status === 'otc') {
        (queryToUpdate as any).resolutionType = 'otc';
      } else if (status === 'deferred') {
        (queryToUpdate as any).resolutionType = 'deferral';
      } else if (status === 'approved') {
        (queryToUpdate as any).resolutionType = 'approved';
      }
      
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
