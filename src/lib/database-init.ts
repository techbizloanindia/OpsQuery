import { connectToDatabase } from './mongodb';
import { config } from './config';
import { BranchModel } from './models/Branch';
import { UserModel } from './models/User';

interface CollectionConfig {
  name: string;
  indexes: Array<{
    fields: Record<string, 1 | -1>;
    options?: Record<string, any>;
  }>;
  validation?: Record<string, any>;
}

export class DatabaseInitializer {
  // Define all required collections with their configurations
  private static collections: CollectionConfig[] = [
    {
      name: 'users',
      indexes: [
        { fields: { employeeId: 1 }, options: { unique: true } },
        { fields: { email: 1 }, options: { unique: true } },
        { fields: { username: 1 }, options: { unique: true } },
        { fields: { role: 1 } },
        { fields: { isActive: 1 } },
        { fields: { branchCode: 1 } },
        { fields: { 'branches.branchCode': 1 } },
        { fields: { createdAt: 1 } },
        { fields: { updatedAt: 1 } }
      ],
      validation: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['employeeId', 'email', 'username', 'role', 'fullName'],
          properties: {
            employeeId: { bsonType: 'string' },
            email: { bsonType: 'string' },
            username: { bsonType: 'string' },
            role: { enum: ['admin', 'operations', 'sales', 'credit'] },
            fullName: { bsonType: 'string' },
            isActive: { bsonType: 'bool' }
          }
        }
      }
    },
    {
      name: 'branches',
      indexes: [
        { fields: { branchCode: 1 }, options: { unique: true } },
        { fields: { branchName: 1 }, options: { unique: true } },
        { fields: { isActive: 1 } },
        { fields: { region: 1 } },
        { fields: { zone: 1 } },
        { fields: { state: 1 } },
        { fields: { city: 1 } },
        { fields: { createdAt: 1 } }
      ],
      validation: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['branchCode', 'branchName', 'city', 'state'],
          properties: {
            branchCode: { bsonType: 'string' },
            branchName: { bsonType: 'string' },
            city: { bsonType: 'string' },
            state: { bsonType: 'string' },
            isActive: { bsonType: 'bool' }
          }
        }
      }
    },
    {
      name: 'applications',
      indexes: [
        { fields: { appNo: 1 }, options: { unique: true } },
        { fields: { status: 1 } },
        { fields: { branchCode: 1 } },
        { fields: { team: 1 } },
        { fields: { priority: 1 } },
        { fields: { submittedAt: 1 } },
        { fields: { uploadedAt: 1 } },
        { fields: { 'queries.queryId': 1 } },
        { fields: { 'queries.status': 1 } },
        { fields: { 'queries.assignedTo': 1 } }
      ]
    },
    {
      name: 'chats',
      indexes: [
        { fields: { queryId: 1 } },
        { fields: { appNo: 1 } },
        { fields: { messageId: 1 }, options: { unique: true } },
        { fields: { senderId: 1 } },
        { fields: { timestamp: 1 } },
        { fields: { isRead: 1 } }
      ]
    },
    {
      name: 'management_users',
      indexes: [
        { fields: { managementId: 1 }, options: { unique: true } },
        { fields: { employeeId: 1 }, options: { unique: true } },
        { fields: { email: 1 }, options: { unique: true } },
        { fields: { role: 1 } },
        { fields: { isActive: 1 } },
        { fields: { createdAt: 1 } }
      ],
      validation: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['managementId', 'employeeId', 'email', 'role', 'name'],
          properties: {
            managementId: { bsonType: 'string' },
            employeeId: { bsonType: 'string' },
            email: { bsonType: 'string' },
            role: { enum: ['management'] },
            name: { bsonType: 'string' },
            isActive: { bsonType: 'bool' }
          }
        }
      }
    },
    {
      name: 'logout_triggers',
      indexes: [
        { fields: { employeeId: 1 } },
        { fields: { processed: 1 } },
        { fields: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
        { fields: { triggeredAt: 1 } },
        { fields: { reason: 1 } }
      ]
    },
    {
      name: 'query_responses',
      indexes: [
        { fields: { queryId: 1 } },
        { fields: { appNo: 1 } },
        { fields: { responseId: 1 }, options: { unique: true } },
        { fields: { responderId: 1 } },
        { fields: { timestamp: 1 } },
        { fields: { status: 1 } }
      ]
    },
    {
      name: 'notifications',
      indexes: [
        { fields: { userId: 1 } },
        { fields: { isRead: 1 } },
        { fields: { type: 1 } },
        { fields: { createdAt: 1 } },
        { fields: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } }
      ]
    }
  ];

  // Initialize all database collections and indexes
  static async initializeDatabase(): Promise<{
    success: boolean;
    collections: string[];
    indexes: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      collections: [] as string[],
      indexes: 0,
      errors: [] as string[]
    };

    try {
      console.log('🔄 Initializing MongoDB database...');
      
      // Skip during build time
      if (process.env.BUILDING === 'true') {
        console.log('🏗️ Database initialization skipped during build time');
        return { ...results, success: true };
      }

      const { db } = await connectToDatabase();

      // Get existing collections
      const existingCollections = await db.listCollections().toArray();
      const existingNames = existingCollections.map(c => c.name);
      
      console.log(`📋 Existing collections: ${existingNames.join(', ') || 'none'}`);

      // Create collections and indexes
      for (const collectionConfig of this.collections) {
        try {
          const collectionName = collectionConfig.name;
          
          // Create collection if it doesn't exist
          if (!existingNames.includes(collectionName)) {
            await db.createCollection(collectionName, {
              validator: collectionConfig.validation
            });
            console.log(`✅ Created collection: ${collectionName}`);
          } else {
            console.log(`📁 Collection already exists: ${collectionName}`);
          }
          
          results.collections.push(collectionName);
          const collection = db.collection(collectionName);

          // Create indexes
          for (const indexConfig of collectionConfig.indexes) {
            try {
              await collection.createIndex(indexConfig.fields, indexConfig.options || {});
              results.indexes++;
              console.log(`📊 Created index on ${collectionName}:`, Object.keys(indexConfig.fields).join(', '));
            } catch (indexError: any) {
              // Ignore duplicate index errors
              if (indexError.code !== 85) {
                console.warn(`⚠️ Index creation warning for ${collectionName}:`, indexError.message);
                results.errors.push(`Index error on ${collectionName}: ${indexError.message}`);
              }
            }
          }

        } catch (collectionError: any) {
          console.error(`❌ Error setting up collection ${collectionConfig.name}:`, collectionError);
          results.errors.push(`Collection error: ${collectionError.message}`);
          results.success = false;
        }
      }

      console.log(`✅ Database initialization complete:`);
      console.log(`   - Collections: ${results.collections.length}`);
      console.log(`   - Indexes: ${results.indexes}`);
      console.log(`   - Errors: ${results.errors.length}`);

      return results;

    } catch (error: any) {
      console.error('💥 Database initialization failed:', error);
      results.success = false;
      results.errors.push(`Initialization failed: ${error.message}`);
      return results;
    }
  }

  // Seed initial data if collections are empty
  static async seedInitialData(): Promise<{
    success: boolean;
    seeded: string[];
    errors: string[];
  }> {
    const results = {
      success: true,
      seeded: [] as string[],
      errors: [] as string[]
    };

    try {
      console.log('🌱 Seeding initial data...');

      // Skip during build time
      if (process.env.BUILDING === 'true') {
        console.log('🏗️ Data seeding skipped during build time');
        return { ...results, success: true };
      }

      const { db } = await connectToDatabase();

      // Seed admin user if users collection is empty
      const usersCount = await db.collection('users').countDocuments();
      if (usersCount === 0) {
        try {
          const adminUser = {
            employeeId: 'ADMIN001',
            username: config.adminCredentials.username,
            email: 'admin@opsquery.com',
            password: config.adminCredentials.password, // Will be hashed by UserModel
            role: 'admin' as const,
            fullName: 'System Administrator',
            branch: 'Head Office',
            branchCode: 'HO001',
            department: 'Administration',
            permissions: ['*'] // All permissions
          };

          await UserModel.createUser(adminUser);
          console.log('👤 Created admin user: ADMIN001');
          results.seeded.push('admin_user');
        } catch (userError: any) {
          console.error('❌ Error creating admin user:', userError);
          results.errors.push(`Admin user creation failed: ${userError.message}`);
        }
      }

      // Seed initial branches if branches collection is empty
      const branchesCount = await db.collection('branches').countDocuments();
      if (branchesCount === 0) {
        try {
          const initialBranches = [
            {
              branchCode: 'HO001',
              branchName: 'Head Office',
              branchAddress: 'Corporate Headquarters',
              city: 'New Delhi',
              state: 'Delhi',
              pincode: '110001',
              phone: '+91-11-12345678',
              email: 'headoffice@opsquery.com',
              branchManager: 'System Administrator',
              managerEmail: 'admin@opsquery.com',
              managerPhone: '+91-11-12345678',
              region: 'North',
              zone: 'Zone-1',
              departments: ['Administration', 'Operations', 'Sales', 'Credit'],
              operatingHours: {
                weekdays: '9:00 AM - 6:00 PM',
                saturday: '9:00 AM - 2:00 PM',
                sunday: 'Closed'
              },
              facilities: ['ATM', 'Parking', 'Conference Room']
            }
          ];

          for (const branch of initialBranches) {
            await BranchModel.createBranch(branch);
          }
          
          console.log(`🏢 Created ${initialBranches.length} initial branches`);
          results.seeded.push('initial_branches');
        } catch (branchError: any) {
          console.error('❌ Error creating initial branches:', branchError);
          results.errors.push(`Branch creation failed: ${branchError.message}`);
        }
      }

      console.log(`✅ Data seeding complete. Seeded: ${results.seeded.join(', ')}`);
      return results;

    } catch (error: any) {
      console.error('💥 Data seeding failed:', error);
      results.success = false;
      results.errors.push(`Seeding failed: ${error.message}`);
      return results;
    }
  }

  // Check database health and connection
  static async checkDatabaseHealth(): Promise<{
    success: boolean;
    status: string;
    collections: string[];
    indexes: Record<string, number>;
    errors: string[];
  }> {
    const results = {
      success: true,
      status: 'healthy',
      collections: [] as string[],
      indexes: {} as Record<string, number>,
      errors: [] as string[]
    };

    try {
      console.log('🔍 Checking database health...');

      // Skip during build time
      if (process.env.BUILDING === 'true') {
        return { ...results, status: 'build-mode' };
      }

      const { client, db } = await connectToDatabase();

      // Test connection
      await client.db("admin").command({ ping: 1 });
      console.log('✅ Database connection healthy');

      // Check collections
      const collections = await db.listCollections().toArray();
      results.collections = collections.map(c => c.name);

      // Check indexes for each collection
      for (const collectionName of results.collections) {
        try {
          const collection = db.collection(collectionName);
          const indexes = await collection.indexes();
          results.indexes[collectionName] = indexes.length;
        } catch (indexError: any) {
          results.errors.push(`Index check failed for ${collectionName}: ${indexError.message}`);
        }
      }

      console.log(`✅ Database health check complete:`);
      console.log(`   - Collections: ${results.collections.length}`);
      console.log(`   - Total indexes: ${Object.values(results.indexes).reduce((a, b) => a + b, 0)}`);

      return results;

    } catch (error: any) {
      console.error('💥 Database health check failed:', error);
      results.success = false;
      results.status = 'unhealthy';
      results.errors.push(`Health check failed: ${error.message}`);
      return results;
    }
  }
} 