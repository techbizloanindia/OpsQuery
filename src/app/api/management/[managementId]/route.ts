import { NextRequest, NextResponse } from 'next/server';
import { ManagementModel } from '@/lib/models/Management';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ managementId: string }> }
) {
  try {
    const { managementId } = await context.params;
    console.log('DELETE request for managementId:', managementId);

    if (!managementId) {
      return NextResponse.json(
        { error: 'Management ID is required' },
        { status: 400 }
      );
    }

    const success = await ManagementModel.deleteManagementUser(managementId);
    console.log('Delete operation result:', success);

    if (success) {
      return NextResponse.json(
        { message: 'Management user deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Management user not found or could not be deleted' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting management user:', error);
    return NextResponse.json(
      { error: 'Failed to delete management user' },
      { status: 500 }
    );
  }
}
