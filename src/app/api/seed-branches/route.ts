import { NextRequest, NextResponse } from 'next/server';
import { BranchModel } from '@/lib/models/Branch';

// POST - Create default branches for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding default branches...');

    // Check if branches already exist
    const existingBranches = await BranchModel.getAllBranches();
    
    if (existingBranches.length > 0) {
      return NextResponse.json({
        success: true,
        message: `${existingBranches.length} branches already exist`,
        data: existingBranches
      });
    }

    // Create default branches with realistic codes
    const defaultBranches = [
      {
        branchCode: 'BR001',
        branchName: 'Corporate Branch - Mumbai',
        branchAddress: 'Corporate Office, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '+91-22-12345678',
        email: 'mumbai@bizloanindia.com',
        branchManager: 'Manager Name',
        managerEmail: 'manager.mumbai@bizloanindia.com',
        managerPhone: '+91-22-12345679',
        region: 'West',
        zone: 'Zone 1',
        isActive: true
      },
      {
        branchCode: 'BR002',
        branchName: 'Operations Branch - Delhi',
        branchAddress: 'Operations Office, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        phone: '+91-11-12345678',
        email: 'delhi@bizloanindia.com',
        branchManager: 'Manager Name',
        managerEmail: 'manager.delhi@bizloanindia.com',
        managerPhone: '+91-11-12345679',
        region: 'North',
        zone: 'Zone 2',
        isActive: true
      },
      {
        branchCode: 'BR003',
        branchName: 'Sales Branch - Bangalore',
        branchAddress: 'Sales Office, Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        phone: '+91-80-12345678',
        email: 'bangalore@bizloanindia.com',
        branchManager: 'Manager Name',
        managerEmail: 'manager.bangalore@bizloanindia.com',
        managerPhone: '+91-80-12345679',
        region: 'South',
        zone: 'Zone 3',
        isActive: true
      },
      {
        branchCode: 'BR004',
        branchName: 'Credit Branch - Hyderabad',
        branchAddress: 'Credit Office, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        phone: '+91-40-12345678',
        email: 'hyderabad@bizloanindia.com',
        branchManager: 'Manager Name',
        managerEmail: 'manager.hyderabad@bizloanindia.com',
        managerPhone: '+91-40-12345679',
        region: 'South',
        zone: 'Zone 3',
        isActive: true
      },
      {
        branchCode: 'BR005',
        branchName: 'Regional Branch - Chennai',
        branchAddress: 'Regional Office, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        phone: '+91-44-12345678',
        email: 'chennai@bizloanindia.com',
        branchManager: 'Manager Name',
        managerEmail: 'manager.chennai@bizloanindia.com',
        managerPhone: '+91-44-12345679',
        region: 'South',
        zone: 'Zone 3',
        isActive: true
      },
      {
        branchCode: 'BR006',
        branchName: 'Regional Branch - Kolkata',
        branchAddress: 'Regional Office, Kolkata',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
        phone: '+91-33-12345678',
        email: 'kolkata@bizloanindia.com',
        branchManager: 'Manager Name',
        managerEmail: 'manager.kolkata@bizloanindia.com',
        managerPhone: '+91-33-12345679',
        region: 'East',
        zone: 'Zone 4',
        isActive: true
      },
      {
        branchCode: 'BR007',
        branchName: 'Service Branch - Pune',
        branchAddress: 'Service Office, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        phone: '+91-20-12345678',
        email: 'pune@bizloanindia.com',
        branchManager: 'Manager Name',
        managerEmail: 'manager.pune@bizloanindia.com',
        managerPhone: '+91-20-12345679',
        region: 'West',
        zone: 'Zone 1',
        isActive: true
      },
      {
        branchCode: 'BR008',
        branchName: 'Trade Branch - Ahmedabad',
        branchAddress: 'Trade Office, Ahmedabad',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        phone: '+91-79-12345678',
        email: 'ahmedabad@bizloanindia.com',
        branchManager: 'Manager Name',
        managerEmail: 'manager.ahmedabad@bizloanindia.com',
        managerPhone: '+91-79-12345679',
        region: 'West',
        zone: 'Zone 1',
        isActive: true
      }
    ];    const createdBranches = [];

    for (const branchData of defaultBranches) {
      try {
        const branch = await BranchModel.createBranch(branchData);
        createdBranches.push(branch);
        console.log(`✅ Created branch: ${branch.branchCode} - ${branch.branchName}`);
      } catch (error) {
        console.error(`❌ Failed to create branch ${branchData.branchCode}:`, error);
      }
    }

    console.log(`🌱 Successfully seeded ${createdBranches.length} default branches`);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdBranches.length} default branches`,
      data: createdBranches
    }, { status: 201 });

  } catch (error) {
    console.error('Error seeding branches:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed default branches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Check if seeding is needed
export async function GET(request: NextRequest) {
  try {
    const branches = await BranchModel.getAllBranches();
    
    return NextResponse.json({
      success: true,
      needsSeeding: branches.length === 0,
      existingBranches: branches.length,
      data: branches
    });

  } catch (error) {
    console.error('Error checking branches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check branches' },
      { status: 500 }
    );
  }
}
