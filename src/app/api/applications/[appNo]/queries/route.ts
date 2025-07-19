import { NextRequest, NextResponse } from 'next/server';

// Query interface for proper typing
interface QueryMessage {
  sender: string;
  text: string;
  timestamp: string;
  isSent: boolean;
}

interface QueryData {
  id: string;
  appNo: string;
  title: string;
  tat: string;
  team: string;
  messages: QueryMessage[];
  markedForTeam: string;
  allowMessaging: boolean;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'resolved' | 'approved' | 'deferred' | 'otc';
  customerName: string;
  caseId: string;
  createdAt: string;
}

// In-memory database for demo purposes
let queriesDatabase: QueryData[] = [];

// Initialize sample data
const initializeSampleData = () => {
  if (queriesDatabase.length === 0) {
    queriesDatabase = [
      // Queries for GGN001
      {
        id: '1001',
        appNo: 'GGN001',
        title: 'CIBIL Score Verification Required',
        tat: '24 hours',
        team: 'Credit',
        messages: [
          {
            sender: 'Operations Team',
            text: 'Please verify CIBIL score for the customer. Score seems to be below threshold of 650. Current score shows 625.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isSent: false
          }
        ],
        markedForTeam: 'credit',
        allowMessaging: true,
        priority: 'high',
        status: 'pending',
        customerName: 'Rahul Sharma',
        caseId: 'CASE001',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '1002',
        appNo: 'GGN001',
        title: 'Income Documents Verification',
        tat: '48 hours',
        team: 'Sales',
        messages: [
          {
            sender: 'Operations Team',
            text: 'Please collect and verify latest 3 months salary slips. Customer has provided only 2 months documents.',
            timestamp: new Date(Date.now() - 5400000).toISOString(),
            isSent: false
          }
        ],
        markedForTeam: 'sales',
        allowMessaging: true,
        priority: 'medium',
        status: 'pending',
        customerName: 'Rahul Sharma',
        caseId: 'CASE001',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      // Queries for GGN002
      {
        id: '1003',
        appNo: 'GGN002',
        title: 'Address Proof Verification',
        tat: '24 hours',
        team: 'Sales',
        messages: [
          {
            sender: 'Operations Team',
            text: 'Customer address proof does not match application address. Please verify current residential address.',
            timestamp: new Date(Date.now() - 2700000).toISOString(),
            isSent: false
          }
        ],
        markedForTeam: 'sales',
        allowMessaging: true,
        priority: 'high',
        status: 'pending',
        customerName: 'Priya Singh',
        caseId: 'CASE002',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      // Queries for GGN003
      {
        id: '1004',
        appNo: 'GGN003',
        title: 'Employment Verification Pending',
        tat: '72 hours',
        team: 'Credit',
        messages: [
          {
            sender: 'Operations Team',
            text: 'HR department not responding to employment verification calls. Please provide alternative contact or visit office.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            isSent: false
          }
        ],
        markedForTeam: 'credit',
        allowMessaging: true,
        priority: 'medium',
        status: 'pending',
        customerName: 'Amit Kumar',
        caseId: 'CASE003',
        createdAt: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: '1005',
        appNo: 'GGN003',
        title: 'Bank Statement Analysis',
        tat: '48 hours',
        team: 'Credit',
        messages: [
          {
            sender: 'Operations Team',
            text: 'Bank statements show irregular salary credits. Please analyze and provide recommendation on creditworthiness.',
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            isSent: false
          }
        ],
        markedForTeam: 'credit',
        allowMessaging: true,
        priority: 'high',
        status: 'pending',
        customerName: 'Amit Kumar',
        caseId: 'CASE003',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      // More sample applications for testing
      {
        id: '1006',
        appNo: 'GGN004',
        title: 'Property Documents Verification',
        tat: '24 hours',
        team: 'Sales',
        messages: [
          {
            sender: 'Operations Team',
            text: 'Property registration documents are unclear. Please verify property ownership and get clear copies.',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            isSent: false
          }
        ],
        markedForTeam: 'sales',
        allowMessaging: true,
        priority: 'high',
        status: 'pending',
        customerName: 'Sunita Devi',
        caseId: 'CASE004',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '1007',
        appNo: 'GGN005',
        title: 'Co-applicant Income Verification',
        tat: '48 hours',
        team: 'both',
        messages: [
          {
            sender: 'Operations Team',
            text: 'Co-applicant income documents are missing. Both sales and credit teams need to coordinate for verification.',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            isSent: false
          }
        ],
        markedForTeam: 'both',
        allowMessaging: true,
        priority: 'medium',
        status: 'pending',
        customerName: 'Rajesh & Meera Gupta',
        caseId: 'CASE005',
        createdAt: new Date(Date.now() - 1200000).toISOString()
      }
    ];
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appNo: string }> }
) {
  try {
    initializeSampleData();
    
    const { searchParams } = new URL(request.url);
    const { appNo: rawAppNo } = await params;
    const team = searchParams.get('team'); // Optional team filter
    
    // Decode URL encoding and trim whitespace
    const appNo = decodeURIComponent(rawAppNo).trim();
    
    console.log(`🔍 Queries API: Searching for queries of App.No: "${appNo}" (original: "${rawAppNo}") for team: ${team}`);
    
    // Filter queries for the specific application
    let applicationQueries = queriesDatabase.filter(q => q.appNo === appNo);
    
    // Apply team-specific access control
    if (team) {
      applicationQueries = applicationQueries.map(query => ({
        ...query,
        allowMessaging: query.markedForTeam === team.toLowerCase() || query.markedForTeam === 'both'
      }));
    }
    
    // Sort by creation date (newest first)
    applicationQueries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`📊 Found ${applicationQueries.length} queries for App.No: "${appNo}"`);
    
    return NextResponse.json({
      success: true,
      data: applicationQueries,
      count: applicationQueries.length,
      appNo,
      teamFilter: team,
      debug: {
        originalParam: rawAppNo,
        decodedParam: decodeURIComponent(rawAppNo),
        trimmedParam: appNo
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('💥 Error fetching application queries:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage || 'Failed to fetch application queries'
      },
      { status: 500 }
    );
  }
} 