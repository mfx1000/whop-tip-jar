import { NextRequest, NextResponse } from 'next/server';
import { whopsdk } from '@/lib/whop-sdk';

// POST - Create checkout configuration for in-app purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, amount, metadata } = body;

    if (!companyId || !amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Company ID and valid amount are required' },
        { status: 400 }
      );
    }

    // Create a checkout configuration with the tip amount
    const checkoutConfig = await whopsdk.checkoutConfigurations.create({
      company_id: companyId,
      plan: {
        initial_price: amount * 100, // Whop uses cents
        plan_type: 'one_time',
        currency: 'usd',
      },
      metadata: {
        ...metadata,
        tip_amount: amount.toString(),
        tip_jar_app: 'tip_jar',
        created_at: new Date().toISOString(),
      },
    } as any); // Type assertion to handle potential SDK type issues

    return NextResponse.json({ 
      success: true, 
      data: checkoutConfig 
    });

  } catch (error) {
    console.error('Error creating checkout configuration:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout configuration' },
      { status: 500 }
    );
  }
}
