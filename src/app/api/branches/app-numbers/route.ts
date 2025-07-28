import { NextRequest, NextResponse } from 'next/server';

interface AppNumberRequest {
  branchCode: string;
  type?: 'loan' | 'credit' | 'deposit' | 'general';
}

// Generate branch-specific application numbers
function generateAppNumber(branchCode: string, type: string = 'general'): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const typePrefix = {
    'loan': 'LN',
    'credit': 'CR', 
    'deposit': 'DP',
    'general': 'GN'
  }[type] || 'GN';
  
  // Format: {BRANCH_CODE}{TYPE_PREFIX}{TIMESTAMP_LAST_6}{RANDOM_3}
  const appNumber = `${branchCode.toUpperCase()}${typePrefix}${timestamp.slice(-6)}${random}`;
  
  return appNumber;
}

// Get next available application number for a branch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchCode = searchParams.get('branchCode');
    const type = searchParams.get('type') || 'general';
    
    if (!branchCode) {
      return NextResponse.json(
        { success: false, error: 'Branch code is required' },
        { status: 400 }
      );
    }
    
    const appNumber = generateAppNumber(branchCode, type);
    
    console.log(`📄 Generated app number: ${appNumber} for branch: ${branchCode}, type: ${type}`);
    
    return NextResponse.json({
      success: true,
      data: {
        appNumber,
        branchCode: branchCode.toUpperCase(),
        type,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('💥 Error generating app number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate application number' },
      { status: 500 }
    );
  }
}

// Generate multiple application numbers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchCode, type = 'general', count = 1 } = body;
    
    if (!branchCode) {
      return NextResponse.json(
        { success: false, error: 'Branch code is required' },
        { status: 400 }
      );
    }
    
    if (count > 100) {
      return NextResponse.json(
        { success: false, error: 'Cannot generate more than 100 application numbers at once' },
        { status: 400 }
      );
    }
    
    const appNumbers = [];
    for (let i = 0; i < count; i++) {
      // Add small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      appNumbers.push(generateAppNumber(branchCode, type));
    }
    
    console.log(`📄 Generated ${count} app numbers for branch: ${branchCode}, type: ${type}`);
    
    return NextResponse.json({
      success: true,
      data: {
        appNumbers,
        branchCode: branchCode.toUpperCase(),
        type,
        count: appNumbers.length,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('💥 Error generating app numbers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate application numbers' },
      { status: 500 }
    );
  }
}
