import { NextRequest, NextResponse } from 'next/server';
import { BranchModel } from '@/lib/models/Branch';

// GET - Retrieve all branches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    
    // Get branches from database
    const branches = await BranchModel.getAllBranches();
    let filteredBranches = branches;
    
    // Filter by active status if specified
    if (active !== null) {
      const isActive = active === 'true';
      filteredBranches = branches.filter(branch => branch.isActive === isActive);
    }
    
    return NextResponse.json({
      success: true,
      data: filteredBranches,
      count: filteredBranches.length
    });
  } catch (error) {
    console.error('Error retrieving branches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve branches' },
      { status: 500 }
    );
  }
}

// POST - Create new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newBranch = await BranchModel.createBranch(body);
    
    return NextResponse.json({
      success: true,
      data: newBranch,
      message: 'Branch created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}
