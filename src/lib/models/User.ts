import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';

const isBuildProcess = process.env.BUILDING === 'true';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'operations' | 'sales' | 'credit';
  fullName: string;
  employeeId: string;
  branch: string;
  branchCode?: string; // Branch code for the primary branch
  branches?: Array<{
    branchCode: string;
    branchName: string;
    assignedAt?: string;
  }>; // Multiple branch assignments for Sales/Credit users
  department: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  permissions: string[];
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'operations' | 'sales' | 'credit';
  fullName: string;
  employeeId: string;
  branch: string;
  branchCode?: string; // Branch code for the primary branch
  branches?: Array<{
    branchCode: string;
    branchName: string;
    assignedAt?: string;
  }>; // Multiple branch assignments for Sales/Credit users
  department: string;
  permissions?: string[];
}

export class UserModel {
  private static collectionName = process.env.MONGODB_USERS_COLLECTION || 'users';

  // Create a new user
  static async createUser(userData: CreateUserData): Promise<User> {
    if (isBuildProcess) {
      console.log('Build process: Mocking createUser');
      return { ...userData, _id: new ObjectId(), isActive: true, createdAt: new Date(), updatedAt: new Date() } as User;
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);

      // Check if user already exists
      const existingUser = await collection.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username },
          { employeeId: userData.employeeId }
        ]
      });

      if (existingUser) {
        throw new Error('User with this email, username, or employee ID already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user object
      const newUser: User = {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        fullName: userData.fullName,
        employeeId: userData.employeeId,
        branch: userData.branch,
        branchCode: userData.branchCode,
        branches: userData.branches,
        department: userData.department,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: userData.permissions || []
      };

      // Insert user
      const result = await collection.insertOne(newUser);
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      return { ...userWithoutPassword, _id: result.insertedId } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getUserById');
      return null;
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getUserByEmail');
      return null;
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      const user = await collection.findOne({ email });
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  // Get all users
  static async getAllUsers(): Promise<User[]> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getAllUsers');
      return [];
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      const users = await collection.find({}).toArray();
      return users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking updateUser');
      return null;
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
      }
      
      updateData.updatedAt = new Date();
      
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (result) {
        const { password, ...userWithoutPassword } = result;
        return userWithoutPassword as User;
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(userId: string): Promise<boolean> {
    if (isBuildProcess) {
      console.log('Build process: Mocking deleteUser');
      return true;
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      const result = await collection.deleteOne({ _id: new ObjectId(userId) });
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Verify user credentials
  static async verifyCredentials(email: string, password: string): Promise<User | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking verifyCredentials');
      return null;
    }
    try {
      const user = await this.getUserByEmail(email);
      if (!user || !user.isActive) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      // Update last login
      await this.updateUser(user._id!.toString(), { lastLogin: new Date() });

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  }

  // Get users by role
  static async getUsersByRole(role: string): Promise<User[]> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getUsersByRole');
      return [];
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      const users = await collection.find({ role: role as any }).toArray();
      return users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      });
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Get users by branch
  static async getUsersByBranch(branch: string): Promise<User[]> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getUsersByBranch');
      return [];
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      const users = await collection.find({ branch }).toArray();
      return users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      });
    } catch (error) {
      console.error('Error getting users by branch:', error);
      throw error;
    }
  }

  // Get user by employee ID
  static async getUserByEmployeeId(employeeId: string): Promise<User | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getUserByEmployeeId');
      return null;
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      const user = await collection.findOne({ employeeId });
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by employee ID:', error);
      throw error;
    }
  }

  // Assign branches to user (for Sales/Credit teams)
  static async assignBranchesToUser(
    employeeId: string, 
    branches: Array<{ branchCode: string; branchName: string }>,
    team: 'sales' | 'credit'
  ): Promise<User | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking assignBranchesToUser');
      return null;
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      // Find the user
      const user = await collection.findOne({ employeeId });
      if (!user) {
        throw new Error(`User with employeeId ${employeeId} not found`);
      }

      // Check if user belongs to the correct team
      if (user.role !== team) {
        throw new Error(`User ${employeeId} is not in ${team} team (current role: ${user.role})`);
      }

      // Prepare the branch assignments with timestamp
      const branchAssignments = branches.map(branch => ({
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        assignedAt: new Date().toISOString(),
        team: team
      }));

      // Store the previous branches for change detection
      const previousBranches = user.branches || [];
      const previousBranchCodes = previousBranches.map(b => b.branchCode).sort();
      const newBranchCodes = branchAssignments.map(b => b.branchCode).sort();
      
      // Check if branches have changed
      const branchesChanged = JSON.stringify(previousBranchCodes) !== JSON.stringify(newBranchCodes);

      // Update user with new branch assignments
      const updateData = {
        branches: branchAssignments,
        updatedAt: new Date(),
        ...(branchesChanged && { branchAssignmentChangedAt: new Date() }) // Track when branches changed
      };

      const result = await collection.findOneAndUpdate(
        { employeeId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (result) {
        const { password, ...userWithoutPassword } = result;
        
        // If branches changed, trigger logout notification for this user
        if (branchesChanged) {
          console.log(`🔄 Branch assignment changed for user ${employeeId}. Previous: [${previousBranchCodes.join(', ')}], New: [${newBranchCodes.join(', ')}]`);
          
          // Store logout trigger in a separate collection for real-time detection
          await this.createLogoutTrigger(employeeId, 'branch_assignment_changed', {
            previousBranches: previousBranchCodes,
            newBranches: newBranchCodes,
            team: team
          });
        }
        
        return userWithoutPassword as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error assigning branches to user:', error);
      throw error;
    }
  }

  // Remove branch assignments from user
  static async removeBranchesFromUser(employeeId: string): Promise<User | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking removeBranchesFromUser');
      return null;
    }
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      const result = await collection.findOneAndUpdate(
        { employeeId },
        { 
          $unset: { branches: "" },
          $set: { 
            updatedAt: new Date(),
            branchAssignmentChangedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (result) {
        // Trigger logout for this user
        await this.createLogoutTrigger(employeeId, 'branch_assignment_removed', {});
        
        const { password, ...userWithoutPassword } = result;
        return userWithoutPassword as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error removing branches from user:', error);
      throw error;
    }
  }

  // Create a logout trigger for automatic logout
  static async createLogoutTrigger(
    employeeId: string, 
    reason: string, 
    metadata: any = {}
  ): Promise<void> {
    if (isBuildProcess) return;
    
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('logout_triggers');
      
      await collection.insertOne({
        employeeId,
        reason,
        metadata,
        triggeredAt: new Date(),
        processed: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // Expire after 5 minutes
      });
      
      console.log(`🚨 Created logout trigger for ${employeeId}: ${reason}`);
    } catch (error) {
      console.error('Error creating logout trigger:', error);
    }
  }

  // Check if user has pending logout triggers
  static async checkLogoutTriggers(employeeId: string): Promise<{
    shouldLogout: boolean;
    reason?: string;
    metadata?: any;
  }> {
    if (isBuildProcess) {
      return { shouldLogout: false };
    }
    
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('logout_triggers');
      
      const trigger = await collection.findOne({
        employeeId,
        processed: false,
        expiresAt: { $gt: new Date() }
      });

      if (trigger) {
        // Mark as processed
        await collection.updateOne(
          { _id: trigger._id },
          { $set: { processed: true, processedAt: new Date() } }
        );

        return {
          shouldLogout: true,
          reason: trigger.reason,
          metadata: trigger.metadata
        };
      }

      return { shouldLogout: false };
    } catch (error) {
      console.error('Error checking logout triggers:', error);
      return { shouldLogout: false };
    }
  }

  // Get user's assigned branches with enhanced filtering
  static async getUserAssignedBranches(
    employeeId: string, 
    team?: 'sales' | 'credit'
  ): Promise<Array<{
    branchCode: string;
    branchName: string;
    assignedAt?: string;
    team?: string;
    isActive?: boolean;
    lastUpdated?: Date;
  }>> {
    if (isBuildProcess) {
      console.log('Build process: Mocking getUserAssignedBranches');
      return [];
    }
    
    try {
      const user = await this.getUserByEmployeeId(employeeId);
      if (!user) {
        throw new Error(`User with employeeId ${employeeId} not found`);
      }

      // If team specified, ensure user belongs to that team
      if (team && user.role !== team) {
        console.warn(`User ${employeeId} requested ${team} branches but has role ${user.role}`);
        return [];
      }

      // Return user's assigned branches
      const branches = user.branches || [];
      
      // Enhance with metadata
      return branches.map(branch => ({
        ...branch,
        isActive: true, // Assume assigned branches are active
        lastUpdated: user.updatedAt
      }));
      
    } catch (error) {
      console.error('Error getting user assigned branches:', error);
      return [];
    }
  }

  // Update user's primary branch code
  static async updateUserBranchCode(employeeId: string, branchCode: string): Promise<User | null> {
    if (isBuildProcess) {
      console.log('Build process: Mocking updateUserBranchCode');
      return null;
    }
    
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection<User>(this.collectionName);
      
      // Get current user to check for changes
      const currentUser = await collection.findOne({ employeeId });
      if (!currentUser) {
        throw new Error(`User with employeeId ${employeeId} not found`);
      }

      const branchChanged = currentUser.branchCode !== branchCode;
      
      const result = await collection.findOneAndUpdate(
        { employeeId },
        { 
          $set: { 
            branchCode,
            updatedAt: new Date(),
            ...(branchChanged && { branchAssignmentChangedAt: new Date() })
          }
        },
        { returnDocument: 'after' }
      );

      if (result && branchChanged) {
        // Trigger logout for branch code change
        await this.createLogoutTrigger(employeeId, 'primary_branch_changed', {
          previousBranchCode: currentUser.branchCode,
          newBranchCode: branchCode
        });
        
        console.log(`🔄 Primary branch changed for user ${employeeId}: ${currentUser.branchCode} → ${branchCode}`);
      }

      if (result) {
        const { password, ...userWithoutPassword } = result;
        return userWithoutPassword as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating user branch code:', error);
      throw error;
    }
  }
}
