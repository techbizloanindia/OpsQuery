import { NextRequest, NextResponse } from 'next/server';

interface ApprovalDecision {
  requestId: string;
  decision: 'approve' | 'reject';
  remarks?: string;
  managementMember?: string;
}

// POST - Handle approval decisions from Management
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, decision, remarks, managementMember }: ApprovalDecision = body;
    
    if (!requestId || !decision) {
      return NextResponse.json(
        { success: false, error: 'Request ID and decision are required' },
        { status: 400 }
      );
    }

    // Get the approval request from query-actions API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/query-actions?type=approval-requests`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch approval requests');
    }
    
    const requestData = await response.json();
    const approvalRequest = requestData.data.find((r: any) => r.id === requestId);
    
    if (!approvalRequest) {
      return NextResponse.json(
        { success: false, error: 'Approval request not found' },
        { status: 404 }
      );
    }

    if (decision === 'approve') {
      // Process the original action (approve, deferral, or otc)
      const timestamp = new Date().toISOString();
      const managementName = managementMember || 'Management Team';
      
      const actionPayload = {
        type: 'action',
        queryId: approvalRequest.queryId,
        action: approvalRequest.requestType,
        assignedTo: approvalRequest.assignedTo,
        remarks: `${approvalRequest.remarks}\n\n[Management Approval] ${remarks || 'Approved by Management'}`,
        operationTeamMember: `${managementMember || 'Management Team'} (via ${approvalRequest.requestedBy})`
      };

      const actionResponse = await fetch(`${baseUrl}/api/query-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionPayload),
      });

      if (!actionResponse.ok) {
        const errorData = await actionResponse.json();
        throw new Error(errorData.error || 'Failed to process approved action');
      }

      const actionResult = await actionResponse.json();

      // Mark the approval request as processed
      await fetch(`${baseUrl}/api/query-actions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: requestId,
          status: 'approved',
          processedBy: managementMember || 'Management Team',
          processDate: timestamp
        }),
      });

      // Create management approval message
      const approvalMessage = `✅ MANAGEMENT APPROVED the ${approvalRequest.requestType.toUpperCase()} request by ${managementName}\n\n📝 Management Remarks: ${remarks || 'No additional remarks'}\n\n🕒 Approved on: ${new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}\n\n✅ Original request by: ${approvalRequest.requestedBy}\n\n${actionResult.message}`;

      return NextResponse.json({
        success: true,
        decision: 'approved',
        message: approvalMessage,
        originalAction: actionResult
      });

    } else {
      // Reject the request
      const timestamp = new Date().toISOString();
      const managementName = managementMember || 'Management Team';
      
      // Mark the approval request as rejected
      await fetch(`${baseUrl}/api/query-actions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: requestId,
          status: 'rejected',
          processedBy: managementMember || 'Management Team',
          processDate: timestamp
        }),
      });
      
      const rejectionMessage = `❌ MANAGEMENT REJECTED the ${approvalRequest.requestType.toUpperCase()} request by ${managementName}\n\n📝 Rejection Reason: ${remarks || 'No reason provided'}\n\n🕒 Rejected on: ${new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}\n\n⚠️ Original request by: ${approvalRequest.requestedBy}\n\n📋 Query remains in pending status.`;

      // Add rejection message to chat
      const rejectionSystemMessage = {
        id: `${Date.now().toString()}-system-${Math.random().toString(36).substring(2, 9)}`,
        queryId: approvalRequest.queryId,
        message: rejectionMessage,
        responseText: rejectionMessage,
        sender: managementName,
        senderRole: 'management',
        team: 'Management',
        timestamp: timestamp,
        isSystemMessage: true,
        actionType: 'rejection',
        requestId: requestId,
        rejectionReason: remarks || 'No reason provided'
      };

      // Send message to query-actions
      await fetch(`${baseUrl}/api/query-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          queryId: approvalRequest.queryId,
          message: rejectionMessage,
          addedBy: managementName,
          team: 'Management'
        }),
      });

      return NextResponse.json({
        success: true,
        decision: 'rejected',
        message: rejectionMessage,
        systemMessage: rejectionSystemMessage
      });
    }

  } catch (error: any) {
    console.error('Error processing approval decision:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve approval requests for Management dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    // Mock approval requests data for dashboard stats
    const mockApprovalRequests: any[] = [];
    
    // Filter by status if specified
    let filteredRequests = mockApprovalRequests;
    if (status !== 'all') {
      filteredRequests = mockApprovalRequests.filter(r => r.status === status);
    }
    
    return NextResponse.json({
      success: true,
      data: filteredRequests,
      count: filteredRequests.length
    });

  } catch (error: any) {
    console.error('Error fetching approval requests:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
