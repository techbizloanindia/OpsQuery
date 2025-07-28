import { NextRequest, NextResponse } from 'next/server';

interface QueryAction {
  queryId: number;
  action: 'approve' | 'deferral' | 'otc' | 'revert' | 'request-approve' | 'request-deferral' | 'request-otc';
  assignedTo?: string;
  remarks?: string;
  operationTeamMember?: string;
  team?: string;
  actionBy?: string;
}

interface QueryMessage {
  queryId: number;
  message: string;
  addedBy: string;
  team: 'Operations' | 'Sales' | 'Credit';
}

// In-memory storage for query actions
const queryActionsDatabase: any[] = [];

// In-memory storage for approval requests pending management approval
const approvalRequestsDatabase: any[] = [];

// Use global message database for sharing between routes
if (typeof global.queryMessagesDatabase === 'undefined') {
  global.queryMessagesDatabase = [];
}

// Reference to the queries database
let queriesDatabase: any[] = [];

// Initialize the queriesDatabase from the queries API route
const initializeQueriesDatabase = async () => {
  try {
    // Skip initialization in build mode or production
    if (process.env.NODE_ENV === 'production' || process.env.BUILDING === 'true') {
      console.log('Skipping database initialization in production/build mode');
      return;
    }
    
    const baseUrl = 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/queries`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        queriesDatabase = data.data;
      }
    }
  } catch (error) {
    console.error('Error initializing queries database:', error);
  }
};

// Initialize sample data
const initializeData = () => {
  // Ensure we have some sample messages if none exist
  if (global.queryMessagesDatabase.length === 0) {
    console.log('Initializing clean database in query-actions');
    global.queryMessagesDatabase = [
      // No sample messages - clean database for production use
    ];
  }
  
  // No sample approval requests - clean database for production use
  if (approvalRequestsDatabase.length === 0) {
    console.log('🌱 Initialized clean approval requests database for production');
  }
};

// Helper function to determine request priority
function determineRequestPriority(requestType: string, queryContext: any, applicationInfo: any): 'low' | 'medium' | 'high' | 'urgent' {
  // OTC requests are typically high priority
  if (requestType === 'otc') {
    return 'high';
  }
  
  // Check loan amount for priority determination
  if (applicationInfo?.loanAmount) {
    const amount = parseFloat(applicationInfo.loanAmount.toString().replace(/[^0-9.]/g, ''));
    if (amount > 5000000) { // 50 lakh or more
      return 'high';
    } else if (amount > 1000000) { // 10 lakh or more
      return 'medium';
    }
  }
  
  // Check if urgent keywords are in query or remarks
  const urgentKeywords = ['urgent', 'emergency', 'immediate', 'asap', 'critical'];
  const queryText = (queryContext?.queries?.[0]?.text || '').toLowerCase();
  
  if (urgentKeywords.some(keyword => queryText.includes(keyword))) {
    return 'urgent';
  }
  
  // Default priority based on request type
  switch (requestType) {
    case 'approve':
      return 'medium';
    case 'deferral':
      return 'low';
    default:
      return 'medium';
  }
}

// POST - Handle query actions, messages, and reverts
export async function POST(request: NextRequest) {
  try {
    // Initialize data
    initializeData();
    
    // Ensure we have the latest queries database
    await initializeQueriesDatabase();
    
    const body = await request.json();
    const { type } = body;

    if (type === 'action') {
      console.log('⚡ Handling action type');
      return handleQueryAction(body);
    } else if (type === 'message') {
      console.log('💬 Handling message type');
      return handleAddMessage(body);
    } else if (type === 'revert') {
      console.log('🔄 Handling revert type');
      return handleRevertAction(body);
    } else {
      console.log('❌ Invalid request type received:', type);
      return NextResponse.json(
        { success: false, error: 'Invalid request type' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error handling query action:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Handle query actions
async function handleQueryAction(body: QueryAction & { type: string }) {
  const { queryId, action, assignedTo, remarks, operationTeamMember } = body;
  
  if (!queryId || !action) {
    return NextResponse.json(
      { success: false, error: 'Query ID and action are required' },
      { status: 400 }
    );
  }

  // Handle approval requests (request-approve, request-deferral, request-otc)
  if (action.startsWith('request-')) {
    const requestType = action.replace('request-', '');
    
    // Get detailed query information for enhanced context
    let queryContext: any = null;
    let applicationInfo: any = null;
    
    try {
      // Try to find the query in the queries database
      await initializeQueriesDatabase();
      const query = (global as any).queriesDatabase?.find((q: any) => q.id === queryId || q.appNo === queryId.toString());
      
      if (query) {
        queryContext = query;
        // Try to get application details if available
        try {
          const appResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/applications/${query.appNo}`);
          if (appResponse.ok) {
            const appData = await appResponse.json();
            applicationInfo = appData.data;
          }
        } catch (error) {
          console.log('Could not fetch application details:', error);
        }
      }
    } catch (error) {
      console.log('Could not fetch query context:', error);
    }
    
    // Create approval request record with enhanced information
    const approvalRequest = {
      id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
      queryId,
      requestType,
      assignedTo,
      remarks,
      requestedBy: operationTeamMember || 'Operations Team',
      requestDate: new Date().toISOString(),
      status: 'pending',
      team: 'Operations',
      // Enhanced context information
      appNo: queryContext?.appNo || queryId.toString(),
      customerName: queryContext?.customerName || applicationInfo?.customerName || 'Unknown Customer',
      branch: queryContext?.branch || applicationInfo?.branch || 'Unknown Branch',
      branchCode: queryContext?.branchCode || applicationInfo?.branchCode || 'Unknown',
      priority: determineRequestPriority(requestType, queryContext, applicationInfo),
      queryText: queryContext?.queries?.[0]?.text || 'Query details not available',
      submittedBy: queryContext?.submittedBy || 'Operations Team',
      markedForTeam: queryContext?.markedForTeam || 'management',
      // Application specific details if available
      loanAmount: applicationInfo?.loanAmount,
      loanType: applicationInfo?.loanType,
      applicationStatus: applicationInfo?.status,
      submittedAt: queryContext?.submittedAt || new Date().toISOString()
    };

    // Store the approval request
    approvalRequestsDatabase.push(approvalRequest);
    
    console.log('📝 Enhanced approval request created:', {
      id: approvalRequest.id,
      type: requestType,
      appNo: approvalRequest.appNo,
      customer: approvalRequest.customerName,
      priority: approvalRequest.priority,
      hasApplicationInfo: !!applicationInfo
    });

    // Create enhanced message for approval request
    const timestamp = new Date().toISOString();
    const operatorName = operationTeamMember || 'Operations Team';
    let message = '';

    switch (requestType) {
      case 'approve':
        message = `📤 APPROVAL REQUEST sent to Management by ${operatorName}\n\n` +
                 `🏢 Application: ${approvalRequest.appNo}\n` +
                 `👤 Customer: ${approvalRequest.customerName}\n` +
                 `🏦 Branch: ${approvalRequest.branch} (${approvalRequest.branchCode})\n` +
                 `💰 ${applicationInfo?.loanAmount ? `Loan Amount: ₹${applicationInfo.loanAmount}` : 'Amount: Not specified'}\n` +
                 `📋 ${applicationInfo?.loanType ? `Loan Type: ${applicationInfo.loanType}` : 'Type: Standard Loan'}\n` +
                 `👤 Proposed assignment: ${assignedTo || 'Not specified'}\n` +
                 `📝 Remarks: ${remarks || 'No additional remarks'}\n` +
                 `📄 Query: ${approvalRequest.queryText.substring(0, 100)}${approvalRequest.queryText.length > 100 ? '...' : ''}\n\n` +
                 `🕒 Requested on: ${new Date(timestamp).toLocaleString('en-US', {
                   year: 'numeric',
                   month: 'long', 
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit',
                   hour12: true
                 })}\n\n⏳ Waiting for Management approval...`;
        break;
      case 'deferral':
        message = `📤 DEFERRAL REQUEST sent to Management by ${operatorName}\n\n` +
                 `🏢 Application: ${approvalRequest.appNo}\n` +
                 `👤 Customer: ${approvalRequest.customerName}\n` +
                 `🏦 Branch: ${approvalRequest.branch} (${approvalRequest.branchCode})\n` +
                 `💰 ${applicationInfo?.loanAmount ? `Loan Amount: ₹${applicationInfo.loanAmount}` : 'Amount: Not specified'}\n` +
                 `📋 ${applicationInfo?.loanType ? `Loan Type: ${applicationInfo.loanType}` : 'Type: Standard Loan'}\n` +
                 `👤 Proposed assignment: ${assignedTo || 'Not specified'}\n` +
                 `📝 Deferral Reason: ${remarks || 'No specific reason provided'}\n` +
                 `📄 Query: ${approvalRequest.queryText.substring(0, 100)}${approvalRequest.queryText.length > 100 ? '...' : ''}\n\n` +
                 `🕒 Requested on: ${new Date(timestamp).toLocaleString('en-US', {
                   year: 'numeric',
                   month: 'long', 
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit',
                   hour12: true
                 })}\n\n⏳ Waiting for Management approval...`;
        break;
      case 'otc':
        message = `📤 OTC REQUEST sent to Management by ${operatorName}\n\n` +
                 `🏢 Application: ${approvalRequest.appNo}\n` +
                 `👤 Customer: ${approvalRequest.customerName}\n` +
                 `🏦 Branch: ${approvalRequest.branch} (${approvalRequest.branchCode})\n` +
                 `💰 ${applicationInfo?.loanAmount ? `Loan Amount: ₹${applicationInfo.loanAmount}` : 'Amount: Not specified'}\n` +
                 `📋 ${applicationInfo?.loanType ? `Loan Type: ${applicationInfo.loanType}` : 'Type: Standard Loan'}\n` +
                 `⚡ Priority: ${approvalRequest.priority.toUpperCase()}\n` +
                 `👤 Proposed assignment: ${assignedTo || 'Senior Manager'}\n` +
                 `📝 OTC Justification: ${remarks || 'High-value transaction requiring OTC approval'}\n` +
                 `📄 Query: ${approvalRequest.queryText.substring(0, 100)}${approvalRequest.queryText.length > 100 ? '...' : ''}\n\n` +
                 `🕒 Requested on: ${new Date(timestamp).toLocaleString('en-US', {
                   year: 'numeric',
                   month: 'long', 
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit',
                   hour12: true
                 })}\n\n⏳ Waiting for Management approval...`;
        break;
    }

    // Add system message for the request
    const systemMessage = {
      id: `${Date.now().toString()}-system-${Math.random().toString(36).substring(2, 9)}`,
      queryId,
      message: message,
      responseText: message,
      sender: operatorName,
      senderRole: 'operations',
      team: 'Operations',
      timestamp: timestamp,
      isSystemMessage: true,
      actionType: `request-${requestType}`,
      assignedTo: assignedTo || null,
      remarks: remarks || '',
      requestId: approvalRequest.id,
      // Additional context for better display
      appNo: approvalRequest.appNo,
      customerName: approvalRequest.customerName,
      priority: approvalRequest.priority
    };
    
    global.queryMessagesDatabase.push(systemMessage);
    
    return NextResponse.json({
      success: true,
      data: approvalRequest,
      message,
      systemMessage,
      requestId: approvalRequest.id
    });
  }

  // Handle direct actions (approve, deferral, otc) - only for Management team now
  // Create action record with enhanced remarks support
  const actionRecord = {
    id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
    queryId,
    action,
    assignedTo,
    remarks: remarks || '', // Ensure remarks are always stored
    operationTeamMember: operationTeamMember || 'Operations Team',
    actionDate: new Date().toISOString(),
    status: 'completed',
    actionBy: body.actionBy || body.team || 'Operations Team'
  };

  // Store the action
  queryActionsDatabase.push(actionRecord);
  
  console.log('✅ Direct action created:', actionRecord);

  // Update the query status in the queries database
  try {
    // Determine the resolved status based on action
    const resolvedStatus = action === 'approve' ? 'approved' : action === 'deferral' ? 'deferred' : action;
    
    // Try to update via API call first for better consistency
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const updateData = {
      queryId,
      status: resolvedStatus,
      resolvedAt: new Date().toISOString(),
      resolvedBy: operationTeamMember || 'Operations Team',
      resolutionReason: action,
      resolutionType: action === 'approve' ? 'approved' : action === 'deferral' ? 'deferral' : action === 'otc' ? 'otc' : undefined,
      assignedTo: assignedTo || null,
      remarks: remarks || '',
      // Always mark as resolved when action is taken
      isResolved: true,
      isIndividualQuery: true // Most actions are on individual queries
    };
    
    console.log('📝 Sending update to queries API:', updateData);
    
    const response = await fetch(`${baseUrl}/api/queries`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (response.ok) {
      const successData = await response.json();
      console.log('✅ Query status updated successfully via API:', successData);
    } else {
      const errorData = await response.json();
      console.warn('⚠️ Failed to update query status via API:', errorData);
      
      // Fallback: Direct database update
      const foundQuery = queriesDatabase.find(q => q.id === queryId);
      if (foundQuery) {
        foundQuery.status = resolvedStatus;
        foundQuery.resolvedAt = new Date().toISOString();
        foundQuery.resolvedBy = operationTeamMember || 'Operations Team';
        foundQuery.resolutionReason = action;
        foundQuery.lastUpdated = new Date().toISOString();
        (foundQuery as any).isResolved = true;
        console.log(`✅ Query ${queryId} updated via fallback method`);
      }
    }
  } catch (error) {
    console.error('Error updating query status:', error);
  }

  console.log('📋 Query action recorded:', actionRecord);

  // Create appropriate message based on action and assigned person
  let message = '';
  const timestamp = new Date().toISOString();
  const operatorName = operationTeamMember || 'Operations Team';
  
  switch (action) {
    case 'approve':
      message = `✅ Query APPROVED by ${operatorName}\n\n📝 Remarks: ${remarks || 'No additional remarks'}\n\n🕒 Approved on: ${new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}\n\n✅ Query has been moved to Query Resolved section.`;
      break;
    case 'deferral':
      message = `⏸️ Query DEFERRED by ${operatorName}\n\n👤 Assigned to: ${assignedTo || 'Not specified'}\n📝 Remarks: ${remarks || 'No additional remarks'}\n\n🕒 Deferred on: ${new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}\n\n📋 Query has been moved to Query Resolved section with Deferral status.`;
      break;
    case 'otc':
      message = `🔄 Query marked as OTC by ${operatorName}\n\n👤 Assigned to: ${assignedTo || 'Not specified'}\n📝 Remarks: ${remarks || 'No additional remarks'}\n\n🕒 OTC assigned on: ${new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}\n\n🏢 Query has been moved to Query Resolved section with OTC status.`;
      break;
  }

  // Add a comprehensive system message to the global chat history
  const systemMessage = {
    id: `${Date.now().toString()}-system-${Math.random().toString(36).substring(2, 9)}`,
    queryId,
    message: message,
    responseText: message,
    sender: operatorName,
    senderRole: 'operations',
    team: 'Operations',
    timestamp: timestamp,
    isSystemMessage: true,
    actionType: action,
    assignedTo: assignedTo || null,
    remarks: remarks || ''
  };
  
  global.queryMessagesDatabase.push(systemMessage);
  console.log('💬 System message added to global message database:', systemMessage);

  return NextResponse.json({
    success: true,
    data: actionRecord,
    message,
    systemMessage
  });
}

// Handle revert actions
async function handleRevertAction(body: any) {
  const { queryId, remarks, team, actionBy, timestamp } = body;
  
  if (!queryId) {
    return NextResponse.json(
      { success: false, error: 'Query ID is required' },
      { status: 400 }
    );
  }

  if (!remarks) {
    return NextResponse.json(
      { success: false, error: 'Remarks are required for revert action' },
      { status: 400 }
    );
  }

  // Create revert action record
  const revertRecord = {
    id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
    queryId: parseInt(queryId),
    action: 'revert',
    remarks,
    team: team || 'Unknown Team',
    actionBy: actionBy || 'Team Member',
    actionDate: timestamp || new Date().toISOString(),
    status: 'completed'
  };

  // Store the revert action
  queryActionsDatabase.push(revertRecord);

  // Update the query status in the queries database
  try {
    // Find the query in the database
    const queryIndex = queriesDatabase.findIndex(q => q.id === parseInt(queryId));
    
    if (queryIndex !== -1) {
      // Update the query to revert it back to pending status
      queriesDatabase[queryIndex] = {
        ...queriesDatabase[queryIndex],
        status: 'pending',
        revertedAt: new Date().toISOString(),
        revertedBy: actionBy || 'Team Member',
        revertReason: remarks,
        lastUpdated: new Date().toISOString(),
        // Remove resolution fields since it's reverted
        resolvedAt: undefined,
        resolvedBy: undefined,
        resolutionReason: undefined
      };
      
      console.log(`✅ Query ${queryId} reverted back to pending status`);
    } else {
      console.warn(`⚠️ Query ${queryId} not found in database`);
    }
    
    // Also make the API call to ensure consistency
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const updateData = {
      queryId,
      status: 'pending',
      revertedAt: new Date().toISOString(),
      revertedBy: actionBy || 'Team Member',
      revertReason: remarks
    };
    
    console.log('📝 Sending revert update to queries API:', updateData);
    
    const response = await fetch(`${baseUrl}/api/queries`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.warn('Failed to update query status via API:', errorData);
    } else {
      const successData = await response.json();
      console.log('✅ Query revert status updated via API:', successData);
    }
  } catch (error) {
    console.warn('Error updating query revert status:', error);
  }

  console.log('📋 Query revert action recorded:', revertRecord);

  // Create a better formatted system message for the revert action
  const teamName = team ? `${team} Team` : 'Team';
  const actionByName = actionBy || 'Team Member';
  
  // Build comprehensive revert message with structured format
  const revertMessage = `🔄 Query Reverted by ${teamName}

👤 Reverted by: ${actionByName}
📅 Reverted on: ${new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}
📝 Reason: ${remarks}

ℹ️ This query has been reverted back to pending status and will need to be processed again by the appropriate team.`;

  // Add a system message to the global chat history
  const systemMessage = {
    id: `${Date.now().toString()}-revert-${Math.random().toString(36).substring(2, 9)}`,
    queryId: parseInt(queryId),
    message: revertMessage,
    responseText: revertMessage,
    sender: actionByName,
    senderRole: team ? team.toLowerCase() : 'team',
    team: teamName,
    timestamp: timestamp || new Date().toISOString(),
    isSystemMessage: true,
    actionType: 'revert',
    revertReason: remarks,
    revertedBy: actionByName
  };
  
  global.queryMessagesDatabase.push(systemMessage);
  console.log('💬 Revert message added to global message database:', systemMessage);

  return NextResponse.json({
    success: true,
    data: revertRecord,
    message: revertMessage,
    systemMessage: systemMessage
  });
}

// Handle adding messages to queries
async function handleAddMessage(body: QueryMessage & { type: string }) {
  const { queryId, message, addedBy, team } = body;
  
  if (!queryId || !message) {
    return NextResponse.json(
      { success: false, error: 'Query ID and message are required' },
      { status: 400 }
    );
  }

  // Ensure queryId is stored as string
  const messageRecord = {
    id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
    queryId: queryId.toString(),
    message,
    responseText: message,
    sender: addedBy || `${team} Team Member`,
    senderRole: team ? team.toLowerCase() : 'operations',
    team: team || 'Operations',
    timestamp: new Date().toISOString()
  };
  
  console.log(`💬 Creating message record for queryId ${queryId}:`, messageRecord);

  // Add to global message database
  global.queryMessagesDatabase.push(messageRecord);

  console.log(`💬 Message from ${team} added to global message database:`, messageRecord);

  return NextResponse.json({
    success: true,
    data: messageRecord,
    message: 'Message added successfully'
  });
}

// GET - Retrieve query actions and messages
export async function GET(request: NextRequest) {
  try {
    // Initialize data
    initializeData();
    
    // Ensure we have the latest queries database
    await initializeQueriesDatabase();
    
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('queryId');
    const type = searchParams.get('type'); // 'actions', 'messages', or 'approval-requests'
    const team = searchParams.get('team'); // 'Sales' or 'Credit'
    const unread = searchParams.get('unread') === 'true';
    const branch = searchParams.get('branch'); // Branch filter for sales/credit
    const branchCode = searchParams.get('branchCode'); // Branch code filter

    if (type === 'approval-requests') {
      // Return pending approval requests for Management dashboard
      let requests = [...approvalRequestsDatabase].filter(r => r.status === 'pending');
      
      if (queryId) {
        const qId = queryId.toString();
        requests = requests.filter(r => r.queryId.toString() === qId);
      }
      
      // Sort by request date (newest first)
      requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
      
      console.log('🔍 Management Dashboard: Retrieved approval requests:', {
        total: approvalRequestsDatabase.length,
        pending: requests.length,
        requests: requests.map(r => ({ id: r.id, queryId: r.queryId, type: r.requestType }))
      });
      
      return NextResponse.json({
        success: true,
        data: requests,
        count: requests.length
      });
    } else if (type === 'actions') {
      let actions = [...queryActionsDatabase];
      if (queryId) {
        // Handle both numeric and string queryIds
        const qId = queryId.toString();
        actions = actions.filter(a => a.queryId.toString() === qId);
        console.log(`🔍 Filtering actions for queryId ${qId}, found ${actions.length} actions`);
      }
      
      return NextResponse.json({
        success: true,
        data: actions,
        count: actions.length
      });
    } else if (type === 'messages') {
      let messages = [...global.queryMessagesDatabase];
      
      if (queryId) {
        // Handle both numeric and string queryIds
        const qId = queryId.toString();
        messages = messages.filter(m => m.queryId.toString() === qId);
        console.log(`🔍 Filtering messages for queryId ${qId}, found ${messages.length} messages`);
      }
      
      // Filter by team if provided - Enhanced for branch-based filtering
      if (team) {
        messages = messages.filter(m => m.team === team || m.senderRole === team.toLowerCase());
        console.log(`🏢 Filtering messages for team ${team}, found ${messages.length} messages`);
        
        // Additional filtering for sales/credit teams based on branch
        if ((team === 'Sales' || team === 'Credit') && (branch || branchCode)) {
          messages = messages.filter(m => {
            // Get the query associated with this message to check branch
            const query = queriesDatabase.find(q => q.id.toString() === m.queryId.toString());
            if (query) {
              if (branch && branchCode) {
                return query.branch === branch || query.branchCode === branchCode;
              } else if (branch) {
                return query.branch === branch;
              } else if (branchCode) {
                return query.branchCode === branchCode;
              }
            }
            return true; // Keep message if query not found
          });
          console.log(`🏢 Branch filtering applied for ${team}, found ${messages.length} messages`);
        }
      }
      
      // Filter by unread status if requested (for notifications)
      if (unread && (team === 'Sales' || team === 'Credit')) {
        // For notifications, we consider messages from Sales/Credit teams that are recent
        const recentTimeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        messages = messages.filter(m => {
          const messageDate = new Date(m.timestamp);
          return messageDate > recentTimeThreshold && 
                 (m.team === team) &&
                 !m.isSystemMessage; // Exclude system messages
        });
        console.log(`🔔 Filtering unread messages for team ${team}, found ${messages.length} messages`);
      }
      
      // Sort messages by timestamp (oldest first, except for notifications which should be newest first)
      if (unread) {
        messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } else {
        messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
      
      // For notifications, enhance messages with application details
      if (unread && team) {
        const enhancedMessages = await Promise.all(messages.map(async (message) => {
          try {
            // Try to get application details for this query
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const queryResponse = await fetch(`${baseUrl}/api/queries`);
            const queryResult = await queryResponse.json();
            
            if (queryResult.success) {
              // Find the application that contains this queryId
              const application = queryResult.data.find((app: any) => 
                app.queries.some((q: any) => q.id === message.queryId.toString())
              );
              
              if (application) {
                return {
                  ...message,
                  appNo: application.appNo,
                  customerName: application.customerName,
                  branch: application.branch
                };
              }
            }
          } catch (error) {
            console.warn('Could not fetch application details for message:', message.id);
          }
          
          return message;
        }));
        
        return NextResponse.json({
          success: true,
          data: enhancedMessages,
          count: enhancedMessages.length
        });
      }
      
      return NextResponse.json({
        success: true,
        data: messages,
        count: messages.length
      });
    } else {
      // Return both actions and messages
      let actions = [...queryActionsDatabase];
      let messages = [...global.queryMessagesDatabase];
      
      if (queryId) {
        // Handle both numeric and string queryIds
        const qId = queryId.toString();
        actions = actions.filter(a => a.queryId.toString() === qId);
        messages = messages.filter(m => m.queryId.toString() === qId);
        
        console.log(`🔍 Filtering messages for queryId ${qId}, found ${messages.length} messages`);
      }
      
      // Sort messages by timestamp (oldest first)
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      return NextResponse.json({
        success: true,
        data: {
          actions,
          messages
        },
        count: {
          actions: actions.length,
          messages: messages.length
        }
      });
    }
  } catch (error: any) {
    console.error('Error fetching query actions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update approval request status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, status, processedBy, processDate } = body;
    
    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    // Find and update the approval request
    const requestIndex = approvalRequestsDatabase.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Approval request not found' },
        { status: 404 }
      );
    }

    // Update the request
    approvalRequestsDatabase[requestIndex] = {
      ...approvalRequestsDatabase[requestIndex],
      status,
      processedBy: processedBy || 'Management Team',
      processDate: processDate || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: approvalRequestsDatabase[requestIndex]
    });

  } catch (error: any) {
    console.error('Error updating approval request:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Make queryMessagesDatabase accessible globally
declare global {
  var queryMessagesDatabase: any[];
}
