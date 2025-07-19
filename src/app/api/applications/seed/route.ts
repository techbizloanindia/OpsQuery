import { NextResponse } from 'next/server';
import { ApplicationModel } from '@/lib/models/Application';

export async function POST() {
  try {
    // Create ALI 256 sample application
    const sampleApplication = {
      appId: 'ALI 256',
      customerName: 'Dharmendra Kumar',
      branch: 'Aligarh-Main',
      status: 'sanctioned' as const,
      amount: 500000,
      appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      priority: 'medium' as const,
      loanType: 'Personal Loan',
      customerPhone: '+91-9876543210',
      customerEmail: 'dharmendra.kumar@email.com',
      documentStatus: 'Complete',
      remarks: 'Sample application for testing',
      uploadedBy: 'System Admin'
    };

    // Check if application already exists
    const existing = await ApplicationModel.getApplicationByAppId('ALI 256');
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'ALI 256 already exists',
        data: existing
      });
    }

    // Create the application
    const newApplication = await ApplicationModel.createApplication(sampleApplication);

    return NextResponse.json({
      success: true,
      message: 'Sample application ALI 256 created successfully',
      data: newApplication
    });

  } catch (error) {
    console.error('Error creating sample application:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create sample application'
    }, { status: 500 });
  }
} 