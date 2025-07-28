import { NextRequest, NextResponse } from 'next/server';

// Types for production seed data
interface QueryData {
  id: number;
  appNo: string;
  queries: Array<{
    id: string;
    text: string;
    status: string;
    timestamp: string;
    sender: string;
    senderRole: string;
  }>;
  sendTo: string[];
  sendToSales: boolean;
  sendToCredit: boolean;
  submittedBy: string;
  submittedAt: string;
  status: string;
  customerName: string;
  branch: string;
  branchCode: string;
  lastUpdated: string;
  markedForTeam: string;
}

// Production seed data for queries with realistic scenarios
const generateProductionSeedData = (): QueryData[] => {
  const branches: any[] = [];

  const generateAppNumber = (branchCode: string, id: number): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${branchCode}L${timestamp}${random}`;
  };

  const currentTime = new Date();
  const productionQueries: QueryData[] = [];

  // Generate realistic production queries
  const scenarios = [
    {
      type: 'credit',
      texts: [
        'Customer credit score review required - borderline CIBIL score of 650',
        'Joint home loan application requires credit assessment for both applicants',
        'Business loan creditworthiness evaluation - manufacturing sector',
        'Personal loan application - customer has existing EMIs running',
        'Credit card limit enhancement request - income verification needed'
      ]
    },
    {
      type: 'sales',
      texts: [
        'High-value customer interested in wealth management services',
        'Corporate client requesting premium banking package',
        'NRI customer seeking investment advisory services',
        'Business customer requiring trade finance solutions',
        'Customer inquiry about insurance and mutual fund products'
      ]
    },
    {
      type: 'both',
      texts: [
        'Large corporate loan requiring both relationship and credit evaluation',
        'Joint venture financing - complex structure needs team collaboration',
        'High-net-worth individual - comprehensive financial solution needed',
        'Merchant banking services with credit facility requirements',
        'Real estate developer seeking construction finance with sales tie-up'
      ]
    }
  ];

  let queryId = 2000; // Start from 2000 for production data

  branches.forEach((branch, branchIndex) => {
    scenarios.forEach((scenario, scenarioIndex) => {
      scenario.texts.forEach((text, textIndex) => {
        const id = queryId++;
        const appNo = generateAppNumber(branch.code, id);
        const hoursAgo = Math.floor(Math.random() * 72) + 1; // 1-72 hours ago
        const submittedAt = new Date(currentTime.getTime() - hoursAgo * 60 * 60 * 1000);

        const customers = [
          'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Gupta', 'Vikram Singh',
          'Meera Joshi', 'Ravi Agarwal', 'Kavya Reddy', 'Sanjay Verma', 'Anita Shah',
          'Deepak Mehta', 'Pooja Mishra', 'Arjun Khanna', 'Neha Bansal', 'Rohit Jain'
        ];

        let sendToSales = false;
        let sendToCredit = false;
        let sendToArray = [];
        let markedForTeam = 'both';

        if (scenario.type === 'sales') {
          sendToSales = true;
          sendToArray = ['Sales'];
          markedForTeam = 'sales';
        } else if (scenario.type === 'credit') {
          sendToCredit = true;
          sendToArray = ['Credit'];
          markedForTeam = 'credit';
        } else {
          sendToSales = true;
          sendToCredit = true;
          sendToArray = ['Sales', 'Credit'];
          markedForTeam = 'both';
        }

        productionQueries.push({
          id,
          appNo,
          queries: [
            {
              id: `query-${id}-1`,
              text,
              status: 'pending',
              timestamp: submittedAt.toISOString(),
              sender: 'Operations Team',
              senderRole: 'operations'
            }
          ],
          sendTo: sendToArray,
          sendToSales,
          sendToCredit,
          submittedBy: 'Operations Team',
          submittedAt: submittedAt.toISOString(),
          status: 'pending',
          customerName: customers[Math.floor(Math.random() * customers.length)],
          branch: branch.name,
          branchCode: branch.code,
          lastUpdated: submittedAt.toISOString(),
          markedForTeam
        });
      });
    });
  });

  return productionQueries;
};

// In-memory storage for production seed data
let productionQueriesDatabase: QueryData[] = [];

// POST - Seed production data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reset = false, count = 0 } = body;

    if (reset) {
      productionQueriesDatabase = [];
      console.log('🗑️ Production database reset');
    }

    const seedData = generateProductionSeedData();
    const dataToAdd = count > 0 ? seedData.slice(0, count) : seedData;
    
    productionQueriesDatabase.push(...dataToAdd);

    console.log(`🌱 Seeded ${dataToAdd.length} production queries`);
    console.log(`📊 Total production queries in database: ${productionQueriesDatabase.length}`);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${dataToAdd.length} production queries`,
      data: {
        seeded: dataToAdd.length,
        total: productionQueriesDatabase.length,
        branches: [...new Set(dataToAdd.map(q => q.branchCode))],
        teams: {
          sales: dataToAdd.filter(q => q.sendToSales).length,
          credit: dataToAdd.filter(q => q.sendToCredit).length,
          both: dataToAdd.filter(q => q.markedForTeam === 'both').length
        }
      }
    });

  } catch (error: any) {
    console.error('Error seeding production data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve production seed data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');
    const branch = searchParams.get('branch');
    const branchCode = searchParams.get('branchCode');
    const status = searchParams.get('status') || 'pending';

    let filteredQueries = [...productionQueriesDatabase];

    // Apply filters
    if (team) {
      if (team === 'sales') {
        filteredQueries = filteredQueries.filter(q => q.sendToSales);
      } else if (team === 'credit') {
        filteredQueries = filteredQueries.filter(q => q.sendToCredit);
      }
    }

    if (branch) {
      filteredQueries = filteredQueries.filter(q => q.branch === branch);
    }

    if (branchCode) {
      filteredQueries = filteredQueries.filter(q => q.branchCode === branchCode);
    }

    if (status) {
      filteredQueries = filteredQueries.filter(q => q.status === status);
    }

    console.log(`📊 Production seed data request: team=${team}, branch=${branch}, found ${filteredQueries.length} queries`);

    return NextResponse.json({
      success: true,
      data: filteredQueries,
      count: filteredQueries.length,
      summary: {
        total: productionQueriesDatabase.length,
        filtered: filteredQueries.length,
        branches: [...new Set(productionQueriesDatabase.map(q => q.branchCode))],
        teams: {
          sales: productionQueriesDatabase.filter(q => q.sendToSales).length,
          credit: productionQueriesDatabase.filter(q => q.sendToCredit).length,
          both: productionQueriesDatabase.filter(q => q.markedForTeam === 'both').length
        }
      }
    });

  } catch (error: any) {
    console.error('Error retrieving production seed data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Clear production seed data
export async function DELETE(request: NextRequest) {
  try {
    const count = productionQueriesDatabase.length;
    productionQueriesDatabase = [];
    
    console.log(`🗑️ Cleared ${count} production queries from seed database`);

    return NextResponse.json({
      success: true,
      message: `Cleared ${count} production queries`,
      data: {
        cleared: count,
        remaining: 0
      }
    });

  } catch (error: any) {
    console.error('Error clearing production seed data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
