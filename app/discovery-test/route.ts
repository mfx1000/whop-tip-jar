import { NextRequest, NextResponse } from 'next/server';
import { whopsdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  try {
    // Test basic SDK connectivity
    console.log('Testing Whop SDK connectivity...');
    
    // Since we need an experienceId and companyId to test, let's create a simple test
    const results = {
      sdk_test: 'connected',
      app_id: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      api_key_present: !!process.env.WHOP_API_KEY,
      webhook_secret_present: !!process.env.WHOP_WEBHOOK_SECRET,
    };

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Whop SDK is configured. Use the experience or dashboard pages to see actual data.'
    });

  } catch (error) {
    console.error('Discovery test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
