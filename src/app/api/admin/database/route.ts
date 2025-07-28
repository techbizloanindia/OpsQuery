import { NextRequest, NextResponse } from 'next/server';
import { DatabaseInitializer } from '@/lib/database-init';

// GET - Check database health and status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin: Checking database health...');

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        status: 'build-mode',
        message: 'Database check skipped during build'
      });
    }

    const healthCheck = await DatabaseInitializer.checkDatabaseHealth();

    return NextResponse.json({
      success: healthCheck.success,
      status: healthCheck.status,
      data: {
        collections: healthCheck.collections,
        indexes: healthCheck.indexes,
        totalCollections: healthCheck.collections.length,
        totalIndexes: Object.values(healthCheck.indexes).reduce((a, b) => a + b, 0)
      },
      errors: healthCheck.errors,
      timestamp: new Date().toISOString(),
      message: healthCheck.success ? 'Database is healthy' : 'Database health issues detected'
    });

  } catch (error) {
    console.error('Error checking database health:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check database health',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Initialize database collections and seed data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log(`🔧 Admin: Database ${action} requested`);

    // Skip during build time
    if (process.env.BUILDING === 'true') {
      return NextResponse.json({
        success: true,
        message: `Database ${action} skipped during build`
      });
    }

    let results;

    switch (action) {
      case 'initialize':
        console.log('🔄 Initializing database...');
        results = await DatabaseInitializer.initializeDatabase();
        
        return NextResponse.json({
          success: results.success,
          action: 'initialize',
          data: {
            collections: results.collections,
            indexesCreated: results.indexes,
            totalCollections: results.collections.length
          },
          errors: results.errors,
          timestamp: new Date().toISOString(),
          message: results.success 
            ? `Successfully initialized ${results.collections.length} collections with ${results.indexes} indexes`
            : 'Database initialization completed with errors'
        });

      case 'seed':
        console.log('🌱 Seeding initial data...');
        results = await DatabaseInitializer.seedInitialData();
        
        return NextResponse.json({
          success: results.success,
          action: 'seed',
          data: {
            seeded: results.seeded,
            totalSeeded: results.seeded.length
          },
          errors: results.errors,
          timestamp: new Date().toISOString(),
          message: results.success 
            ? `Successfully seeded: ${results.seeded.join(', ')}`
            : 'Data seeding completed with errors'
        });

      case 'full_setup':
        console.log('🚀 Performing full database setup...');
        
        // First initialize
        const initResults = await DatabaseInitializer.initializeDatabase();
        
        // Then seed data
        const seedResults = await DatabaseInitializer.seedInitialData();
        
        return NextResponse.json({
          success: initResults.success && seedResults.success,
          action: 'full_setup',
          data: {
            initialization: {
              collections: initResults.collections,
              indexes: initResults.indexes
            },
            seeding: {
              seeded: seedResults.seeded
            }
          },
          errors: [...initResults.errors, ...seedResults.errors],
          timestamp: new Date().toISOString(),
          message: `Full setup complete. Collections: ${initResults.collections.length}, Indexes: ${initResults.indexes}, Seeded: ${seedResults.seeded.join(', ')}`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: initialize, seed, or full_setup'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in database setup:', error);
    return NextResponse.json({
      success: false,
      error: 'Database setup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 