import { NextRequest, NextResponse } from 'next/server';
import { collections } from '@/lib/firebase';

// Mock payment processing for development testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyId,
      experienceId,
      amount,
      fromUserId,
      fromUsername = 'Test User',
      success = true
    } = body;

    if (!companyId || !amount || !fromUserId) {
      return NextResponse.json(
        { error: 'Company ID, amount, and user ID are required' },
        { status: 400 }
      );
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!success) {
      return NextResponse.json(
        { error: 'Payment failed - this is a test failure' },
        { status: 400 }
      );
    }

    // Create mock payment record
    const mockPayment = {
      id: `mock_payment_${Date.now()}`,
      amount: amount * 100, // Convert to cents
      amount_after_fees: amount * 100 * 0.971, // Simulate Whop fees (~2.9% + $0.30)
      company: { id: companyId },
      user: { id: fromUserId, username: fromUsername },
      product: { id: `mock_product_${amount}` },
      status: 'completed',
      created: new Date().toISOString(),
    };

    // Record transaction in database (same as webhook)
    const transactionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tip-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        experienceId,
        fromUserId,
        fromUsername,
        amount,
        paymentId: mockPayment.id,
        productId: mockPayment.product.id,
        status: 'completed',
        creatorAmount: amount * 0.8,
        developerAmount: amount * 0.2,
        whopFee: amount * 0.029 + 0.30,
      }),
    });

    // Update analytics
    const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tip-analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        tipAmount: amount,
        creatorAmount: amount * 0.8,
        developerAmount: amount * 0.2,
        whopFee: amount * 0.029 + 0.30,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Mock payment processed successfully',
      data: {
        payment: mockPayment,
        transactionRecorded: transactionResponse.ok,
        analyticsUpdated: analyticsResponse.ok,
        mockMode: true,
      }
    });

  } catch (error) {
    console.error('Error processing mock payment:', error);
    return NextResponse.json(
      { error: 'Failed to process mock payment' },
      { status: 500 }
    );
  }
}

// GET - Get mock payment history for testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Get transaction history
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tip-history?companyId=${companyId}`);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      mockMode: true,
    });

  } catch (error) {
    console.error('Error fetching mock payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mock payment history' },
      { status: 500 }
    );
  }
}
