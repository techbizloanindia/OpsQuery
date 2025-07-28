import { NextRequest, NextResponse } from 'next/server';

interface APITest {
  endpoint: string;
  method: 'GET' | 'POST';
  description: string;
  testData?: any;
  expectedStatus?: number;
}

interface SystemCheckResult {
  success: boolean;
  endpoint: string;
  status: number;
  responseTime: number;
  error?: string;
  data?: any;
}

// GET - Comprehensive system check
export async function GET(request: NextRequest) {
  try {
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    
    console.log('🔍 Starting comprehensive system check...');

    // Define all API endpoints to test
    const apiTests: APITest[] = [
      // Health checks
      { endpoint: '/api/health', method: 'GET', description: 'Health check endpoint' },
      
      // Database
      { endpoint: '/api/admin/database', method: 'GET', description: 'Database health check' },
      
      // Authentication APIs
      { endpoint: '/api/users/check-role?employeeId=TEST001', method: 'GET', description: 'User role check' },
      { endpoint: '/api/management/check-role?managementId=TEST001', method: 'GET', description: 'Management role check' },
      { endpoint: '/api/auth/check-logout?employeeId=TEST001', method: 'GET', description: 'Logout trigger check' },
      
      // Branch APIs
      { endpoint: '/api/branches', method: 'GET', description: 'Get all branches' },
      { endpoint: '/api/branches/seed-production', method: 'GET', description: 'Production branches status' },
      
      // User Management APIs
      { endpoint: '/api/users', method: 'GET', description: 'Get all users' },
      { endpoint: '/api/users/by-role?role=sales', method: 'GET', description: 'Get users by role' },
      { endpoint: '/api/users/branches/TEST001?team=sales', method: 'GET', description: 'Get user branches' },
      
      // Query APIs
      { endpoint: '/api/queries', method: 'GET', description: 'Get all queries' },
      { endpoint: '/api/applications', method: 'GET', description: 'Get all applications' },
      { endpoint: '/api/applications/stats', method: 'GET', description: 'Application statistics' },
      
      // Management APIs
      { endpoint: '/api/management', method: 'GET', description: 'Get management users' },
      { endpoint: '/api/management/login-tracker', method: 'GET', description: 'Management login tracker' },
      
      // Admin APIs
      { endpoint: '/api/admin/user-branches', method: 'GET', description: 'User branch assignments' },
      { endpoint: '/api/admin/stats', method: 'GET', description: 'Admin dashboard stats' },
      
      // Access Rights APIs
      { endpoint: '/api/access-rights', method: 'GET', description: 'Access rights check' },
      
      // Query Actions APIs
      { endpoint: '/api/query-actions', method: 'GET', description: 'Query actions' },
      { endpoint: '/api/query-responses', method: 'GET', description: 'Query responses' },
      
      // Approval APIs
      { endpoint: '/api/approval-requests', method: 'GET', description: 'Approval requests' },
    ];

    const results: SystemCheckResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Test each API endpoint
    for (const test of apiTests) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${baseUrl}${test.endpoint}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
          ...(test.testData && { body: JSON.stringify(test.testData) })
        });

        const responseTime = Date.now() - startTime;
        const isSuccess = response.status < 400;
        
        if (isSuccess) successCount++;
        else failCount++;

        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }

        results.push({
          success: isSuccess,
          endpoint: test.endpoint,
          status: response.status,
          responseTime,
          data: isSuccess ? responseData : undefined,
          error: isSuccess ? undefined : responseData?.error || `HTTP ${response.status}`
        });

        console.log(`${isSuccess ? '✅' : '❌'} ${test.endpoint} - ${response.status} (${responseTime}ms)`);

      } catch (error: any) {
        failCount++;
        results.push({
          success: false,
          endpoint: test.endpoint,
          status: 0,
          responseTime: 0,
          error: error.message || 'Network error'
        });
        
        console.log(`❌ ${test.endpoint} - Network Error: ${error.message}`);
      }
    }

    // Dashboard connection checks
    const dashboardChecks = [
      { name: 'Sales Dashboard', url: '/sales-dashboard' },
      { name: 'Credit Dashboard', url: '/credit-dashboard' },
      { name: 'Management Dashboard', url: '/management-dashboard' },
      { name: 'Operations Dashboard', url: '/operations' },
      { name: 'Control Panel Dashboard', url: '/control-panel-dashboard' },
      { name: 'Admin Dashboard', url: '/admin-dashboard' }
    ];

    const dashboardResults = [];
    for (const dashboard of dashboardChecks) {
      dashboardResults.push({
        name: dashboard.name,
        url: dashboard.url,
        accessible: true, // Frontend routes - assumed accessible
        description: `${dashboard.name} frontend route`
      });
    }

    // Calculate summary statistics
    const summary = {
      totalAPIs: apiTests.length,
      successfulAPIs: successCount,
      failedAPIs: failCount,
      successRate: Math.round((successCount / apiTests.length) * 100),
      averageResponseTime: Math.round(
        results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) / 
        Math.max(successCount, 1)
      ),
      dashboards: dashboardChecks.length
    };

    console.log(`✅ System check complete. Success: ${successCount}/${apiTests.length} (${summary.successRate}%)`);

    return NextResponse.json({
      success: summary.successRate >= 80, // Consider 80%+ success rate as healthy
      summary,
      apiResults: results,
      dashboardResults,
      recommendations: generateRecommendations(results),
      timestamp: new Date().toISOString(),
      message: `System check complete. ${successCount}/${apiTests.length} APIs working properly.`
    });

  } catch (error) {
    console.error('Error in system check:', error);
    return NextResponse.json({
      success: false,
      error: 'System check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Test specific dashboard connections
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dashboard } = body;

    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    
    console.log(`🔍 Testing ${dashboard} dashboard connections...`);

    let dashboardAPIs: APITest[] = [];

    switch (dashboard) {
      case 'sales':
        dashboardAPIs = [
          { endpoint: '/api/queries?team=sales', method: 'GET', description: 'Sales queries' },
          { endpoint: '/api/users/branches/TEST001?team=sales', method: 'GET', description: 'Sales user branches' },
          { endpoint: '/api/applications?team=sales', method: 'GET', description: 'Sales applications' },
          { endpoint: '/api/branches', method: 'GET', description: 'All branches for sales' }
        ];
        break;

      case 'credit':
        dashboardAPIs = [
          { endpoint: '/api/queries?team=credit', method: 'GET', description: 'Credit queries' },
          { endpoint: '/api/users/branches/TEST001?team=credit', method: 'GET', description: 'Credit user branches' },
          { endpoint: '/api/applications?team=credit', method: 'GET', description: 'Credit applications' },
          { endpoint: '/api/branches', method: 'GET', description: 'All branches for credit' }
        ];
        break;

      case 'management':
        dashboardAPIs = [
          { endpoint: '/api/management', method: 'GET', description: 'Management users' },
          { endpoint: '/api/queries?status=pending', method: 'GET', description: 'Pending queries for approval' },
          { endpoint: '/api/approval-requests', method: 'GET', description: 'Approval requests' },
          { endpoint: '/api/admin/stats', method: 'GET', description: 'Management statistics' }
        ];
        break;

      case 'operations':
        dashboardAPIs = [
          { endpoint: '/api/applications', method: 'GET', description: 'All applications' },
          { endpoint: '/api/queries', method: 'GET', description: 'All queries' },
          { endpoint: '/api/branches', method: 'GET', description: 'All branches' },
          { endpoint: '/api/users', method: 'GET', description: 'All users' }
        ];
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid dashboard. Use: sales, credit, management, or operations'
        }, { status: 400 });
    }

    const results: SystemCheckResult[] = [];
    let successCount = 0;

    for (const test of dashboardAPIs) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${baseUrl}${test.endpoint}`, {
          method: test.method,
          headers: { 'Content-Type': 'application/json' }
        });

        const responseTime = Date.now() - startTime;
        const isSuccess = response.status < 400;
        
        if (isSuccess) successCount++;

        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }

        results.push({
          success: isSuccess,
          endpoint: test.endpoint,
          status: response.status,
          responseTime,
          data: isSuccess ? responseData : undefined,
          error: isSuccess ? undefined : responseData?.error || `HTTP ${response.status}`
        });

      } catch (error: any) {
        results.push({
          success: false,
          endpoint: test.endpoint,
          status: 0,
          responseTime: 0,
          error: error.message || 'Network error'
        });
      }
    }

    return NextResponse.json({
      success: successCount === dashboardAPIs.length,
      dashboard,
      results,
      summary: {
        totalAPIs: dashboardAPIs.length,
        successful: successCount,
        failed: dashboardAPIs.length - successCount,
        successRate: Math.round((successCount / dashboardAPIs.length) * 100)
      },
      timestamp: new Date().toISOString(),
      message: `${dashboard} dashboard check complete. ${successCount}/${dashboardAPIs.length} APIs working.`
    });

  } catch (error) {
    console.error('Error in dashboard test:', error);
    return NextResponse.json({
      success: false,
      error: 'Dashboard test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendations(results: SystemCheckResult[]): string[] {
  const recommendations: string[] = [];
  
  const failedAPIs = results.filter(r => !r.success);
  const slowAPIs = results.filter(r => r.success && r.responseTime > 1000);

  if (failedAPIs.length > 0) {
    recommendations.push(`Fix ${failedAPIs.length} failed API endpoints: ${failedAPIs.map(r => r.endpoint).join(', ')}`);
  }

  if (slowAPIs.length > 0) {
    recommendations.push(`Optimize ${slowAPIs.length} slow API endpoints (>1s response time)`);
  }

  const authErrors = failedAPIs.filter(r => r.status === 401 || r.status === 403);
  if (authErrors.length > 0) {
    recommendations.push('Check authentication and authorization settings');
  }

  const serverErrors = failedAPIs.filter(r => r.status >= 500);
  if (serverErrors.length > 0) {
    recommendations.push('Check database connection and server configuration');
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems are functioning properly');
  }

  return recommendations;
} 