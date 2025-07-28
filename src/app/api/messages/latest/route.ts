import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      });
    }

    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team') || 'operations';
    const since = searchParams.get('since') || '';

    const { db } = await connectToDatabase();
    
    // Build query for latest messages
    const filter: any = { };

    // Filter by team if specified
    if (team !== 'all') {
      filter.$or = [
        { team: team },
        { markedForTeam: team }
      ];
    }

    // Filter by timestamp if provided
    if (since) {
      filter.timestamp = { $gt: since };
    }

    // Get latest messages from query responses collection
    const messages = await db.collection('query_responses')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Error fetching latest messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch latest messages'
      },
      { status: 500 }
    );
  }
} 