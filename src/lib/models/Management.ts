import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';

const isBuildProcess = process.env.BUILDING === 'true';

export interface ManagementUser {
  _id?: ObjectId;
  managementId: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'management';
  password: string;
  permissions: string[];
  queryTeamPreferences?: ('sales' | 'credit' | 'both')[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateManagementUserData {
  managementId: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'management';
  password: string;
  permissions: string[];
  queryTeamPreferences?: ('sales' | 'credit' | 'both')[];
}

export class ManagementModel {
  private static collectionName = process.env.MONGODB_MANAGEMENT_COLLECTION || 'management_users';

  // Create a new management user
  static async createManagementUser(userData: CreateManagementUserData): Promise<ManagementUser> {
    if (isBuildProcess) {
      console.log('Build process: Mocking createManagementUser');
      const mockUser: ManagementUser = {
        _id: new ObjectId(),
        ...userData,
        password: 'hashed_password_mock',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      return mockUser;
    }

    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);

      // Use the provided management ID instead of generating one
      const managementId = userData.managementId;

      // Check if employee ID already exists
      const existingEmployeeUser = await collection.findOne({ employeeId: userData.employeeId });
      if (existingEmployeeUser) {
        throw new Error(`Employee ID ${userData.employeeId} is already associated with Management ID ${existingEmployeeUser.managementId}`);
      }

      // Check if management ID already exists
      const existingUser = await collection.findOne({ managementId });
      if (existingUser) {
        throw new Error(`Management ID ${managementId} already exists`);
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const newUser: ManagementUser = {
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const result = await collection.insertOne(newUser);
      
      // Return user without password for security
      const { password, ...userWithoutPassword } = newUser;
      return { ...userWithoutPassword, _id: result.insertedId, password: '' };
    } catch (error) {
      console.error('Error creating management user:', error);
      throw error;
    }
  }

  // Get all management users
  static async getAllManagementUsers(): Promise<ManagementUser[]> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getAllManagementUsers');
      return [];
    }

    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);
      
      const users = await collection.find({ isActive: true }, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
      return users.map(user => ({ ...user, password: '' }));
    } catch (error) {
      console.error('Error getting management users:', error);
      throw error;
    }
  }

  // Get management user by ID
  static async getManagementUserById(managementId: string): Promise<ManagementUser | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getManagementUserById');
      return null;
    }

    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);
      
      // Find user regardless of isActive status, then check if active (treating missing isActive as true for backward compatibility)
      const user = await collection.findOne({ managementId });
      
      if (user && user.isActive !== false) {
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting management user by ID:', error);
      throw error;
    }
  }

  // Update management user
  static async updateManagementUser(managementId: string, updateData: Partial<ManagementUser>): Promise<ManagementUser | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking updateManagementUser');
      return null;
    }

    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);

      const result = await collection.findOneAndUpdate(
        { managementId },
        { 
          $set: { 
            ...updateData, 
            updatedAt: new Date() 
          } 
        },
        { returnDocument: 'after' }
      );

      return result;
    } catch (error) {
      console.error('Error updating management user:', error);
      throw error;
    }
  }

  // Deactivate management user
  static async deactivateManagementUser(managementId: string): Promise<boolean> {
    if (isBuildProcess) {
      console.log('Build process: Mocking deactivateManagementUser');
      return true;
    }

    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);

      const result = await collection.updateOne(
        { managementId },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date() 
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error deactivating management user:', error);
      throw error;
    }
  }

  // Delete management user
  static async deleteManagementUser(managementId: string): Promise<boolean> {
    if (isBuildProcess) {
      console.log('Build process: Mocking deleteManagementUser');
      return true;
    }

    try {
      console.log('Attempting to delete management user with ID:', managementId);
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);

      // First check if the user exists
      const existingUser = await collection.findOne({ managementId });
      console.log('Existing user found:', existingUser ? 'Yes' : 'No');

      if (!existingUser) {
        console.log('Management user not found for deletion:', managementId);
        return false;
      }

      const result = await collection.deleteOne({ managementId });
      console.log('Delete result:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting management user:', error);
      throw error;
    }
  }

  // Update password
  static async updatePassword(managementId: string, newPassword: string): Promise<boolean> {
    if (isBuildProcess) {
      console.log('Build process: Mocking updatePassword');
      return true;
    }

    try {
      console.log(`🔐 Updating password for managementId: ${managementId}`);
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);

      // First check if user exists
      const existingUser = await collection.findOne({ managementId });
      console.log(`👤 User exists: ${existingUser ? 'Yes' : 'No'}`);
      console.log(`👤 User active: ${existingUser?.isActive !== false ? 'Yes' : 'No'}`);

      if (!existingUser) {
        console.log(`❌ Management user not found: ${managementId}`);
        return false;
      }

      if (existingUser.isActive === false) {
        console.log(`❌ Management user is inactive: ${managementId}`);
        return false;
      }

      // Hash the new password
      const saltRounds = 10;
      console.log('🔒 Hashing new password...');
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const result = await collection.updateOne(
        { managementId, isActive: { $ne: false } },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date() 
          } 
        }
      );

      console.log(`📊 Update result: modifiedCount = ${result.modifiedCount}`);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('💥 Error updating password:', error);
      throw error;
    }
  }

  // Get management user for login (includes password)
  static async getManagementUserForLogin(managementId: string): Promise<ManagementUser | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getManagementUserForLogin');
      return null;
    }

    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);
      
      // Find user regardless of isActive status for login check
      const user = await collection.findOne({ managementId });
      return user;
    } catch (error) {
      console.error('Error getting management user for login:', error);
      throw error;
    }
  }

  // Get management user by employee ID
  static async getManagementUserByEmployeeId(employeeId: string): Promise<ManagementUser | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getManagementUserByEmployeeId');
      return null;
    }

    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<ManagementUser>(this.collectionName);
      
      const user = await collection.findOne({ employeeId, isActive: true }, { projection: { password: 0 } });
      return user ? { ...user, password: '' } : null;
    } catch (error) {
      console.error('Error getting management user by employee ID:', error);
      throw error;
    }
  }
}
