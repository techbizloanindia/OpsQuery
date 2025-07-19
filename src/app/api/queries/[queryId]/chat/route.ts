import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  id: string;
  queryId: string;
  message: string;
  text: string;
  sender: string;
  senderRole: string;
  timestamp: string;
  team?: string;
  responseText?: string;
}

// In-memory chat storage for demo purposes
const chatDatabase: ChatMessage[] = [];

// Initialize sample chat data
const initializeChatData = () => {
  if (chatDatabase.length === 0) {
    const sampleChats: ChatMessage[] = [
      {
        id: 'chat-1001-1',
        queryId: '1001',
        message: 'Customer documents have been verified. All income proofs are satisfactory and meet our lending criteria.',
        text: 'Customer documents have been verified. All income proofs are satisfactory and meet our lending criteria.',
        sender: 'Sales Team',
        senderRole: 'sales',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        team: 'Sales',
        responseText: 'Customer documents have been verified. All income proofs are satisfactory and meet our lending criteria.'
      },
      {
        id: 'chat-1001-2',
        queryId: '1001',
        message: 'Please provide verification for the submitted documents.',
        text: 'Please provide verification for the submitted documents.',
        sender: 'Operations Team',
        senderRole: 'operations',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        team: 'Operations',
        responseText: 'Please provide verification for the submitted documents.'
      },
      {
        id: 'chat-1002-1',
        queryId: '1002',
        message: 'Credit score has been verified. Customer meets all lending criteria with a score of 750+. Credit assessment is complete.',
        text: 'Credit score has been verified. Customer meets all lending criteria with a score of 750+. Credit assessment is complete.',
        sender: 'Credit Team',
        senderRole: 'credit',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        team: 'Credit',
        responseText: 'Credit score has been verified. Customer meets all lending criteria with a score of 750+. Credit assessment is complete.'
      },
      {
        id: 'chat-1002-2',
        queryId: '1002',
        message: 'Please verify credit score and assess lending eligibility.',
        text: 'Please verify credit score and assess lending eligibility.',
        sender: 'Operations Team',
        senderRole: 'operations',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        team: 'Operations',
        responseText: 'Please verify credit score and assess lending eligibility.'
      }
    ];
    
    chatDatabase.push(...sampleChats);
  }
};

// GET - Fetch chat messages for a specific query
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    initializeChatData();
    
    const { queryId } = await params;
    
    console.log(`💬 Fetching chat messages for query ID: ${queryId}`);
    
    // Filter messages for this specific query
    const queryMessages = chatDatabase.filter(msg => msg.queryId === queryId);
    
    // Sort by timestamp (oldest first)
    queryMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`✅ Found ${queryMessages.length} chat messages for query ${queryId}`);
    
    return NextResponse.json({
      success: true,
      data: queryMessages,
      count: queryMessages.length
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('💥 Error fetching chat messages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch chat messages: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

// POST - Add a new chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    initializeChatData();
    
    const { queryId } = await params;
    const body = await request.json();
    const { message, sender, senderRole, team } = body;
    
    if (!message || !sender || !senderRole) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message, sender, and senderRole are required' 
        },
        { status: 400 }
      );
    }
    
    // Create new chat message
    const newMessage: ChatMessage = {
      id: `chat-${queryId}-${Date.now()}`,
      queryId: queryId,
      message: message,
      text: message,
      sender: sender,
      senderRole: senderRole,
      timestamp: new Date().toISOString(),
      team: team || senderRole,
      responseText: message
    };
    
    // Add to chat database
    chatDatabase.push(newMessage);
    
    console.log(`💬 Added new chat message for query ${queryId}:`, newMessage);
    
    return NextResponse.json({
      success: true,
      data: newMessage,
      message: 'Chat message added successfully'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('💥 Error adding chat message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to add chat message: ${errorMessage}`
      },
      { status: 500 }
    );
  }
} 