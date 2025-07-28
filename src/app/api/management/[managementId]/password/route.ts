import { NextRequest, NextResponse } from 'next/server';
import { ManagementModel } from '@/lib/models/Management';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ managementId: string }> }
) {
  try {
    const { managementId } = await context.params;
    const body = await request.json();
    const { password } = body;

    console.log(`🔐 Password update request for managementId: ${managementId}`);

    if (!managementId) {
      console.log('❌ Missing managementId');
      return NextResponse.json(
        { error: 'Management ID is required' },
        { status: 400 }
      );
    }

    if (!password) {
      console.log('❌ Missing password');
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    console.log(`🔄 Attempting to update password for: ${managementId}`);
    const success = await ManagementModel.updatePassword(managementId, password);

    if (success) {
      console.log(`✅ Password updated successfully for: ${managementId}`);
      return NextResponse.json(
        { message: 'Password updated successfully', success: true },
        { status: 200 }
      );
    } else {
      console.log(`❌ Management user not found: ${managementId}`);
      return NextResponse.json(
        { error: 'Management user not found or inactive' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
