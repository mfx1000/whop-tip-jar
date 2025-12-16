import { NextRequest, NextResponse } from 'next/server';

// Test webhook endpoint for local development
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, testAmount = 10.00 } = body;

    // Create mock webhook payloads for testing
    const mockWebhooks = {
      'payment.created': {
        type: 'payment.created',
        data: {
          id: 'pay_test_' + Date.now(),
          amount: testAmount * 100, // Convert to cents
          company: { id: 'biz_test_company_id' },
          user: { 
            id: 'user_test_user_id',
            username: 'testuser'
          },
          checkout: {
            metadata: {
              experienceId: 'exp_test_id',
              experienceName: 'Test Experience',
              tipperId: 'user_test_tipper_id',
              tipperName: 'Test Tipper'
            }
          },
          created_at: new Date().toISOString()
        }
      },
      'payment.succeeded': {
        type: 'payment.succeeded',
        data: {
          id: 'pay_test_' + Date.now(),
          amount: testAmount * 100, // Convert to cents
          amount_after_fees: Math.round((testAmount - 0.61) * 100), // Estimated after fees
          fee_amount: Math.round(0.61 * 100), // Estimated fees
          company: { id: 'biz_test_company_id' },
          user: { 
            id: 'user_test_user_id',
            username: 'testuser'
          },
          checkout: {
            metadata: {
              experienceId: 'exp_test_id',
              experienceName: 'Test Experience',
              tipperId: 'user_test_tipper_id',
              tipperName: 'Test Tipper'
            }
          },
          created_at: new Date().toISOString()
        }
      },
      'payment.failed': {
        type: 'payment.failed',
        data: {
          id: 'pay_test_' + Date.now(),
          amount: testAmount * 100,
          company: { id: 'biz_test_company_id' },
          user: { 
            id: 'user_test_user_id',
            username: 'testuser'
          },
          error: { message: 'Test payment failure' },
          created_at: new Date().toISOString()
        }
      },
      'dispute.created': {
        type: 'dispute.created',
        data: {
          id: 'disp_test_' + Date.now(),
          payment_id: 'pay_test_' + Date.now(),
          amount: testAmount * 100,
          company: { id: 'biz_test_company_id' },
          user: { 
            id: 'user_test_user_id',
            username: 'testuser'
          },
          reason: 'Test dispute',
          created_at: new Date().toISOString()
        }
      }
    };

    const webhookPayload = mockWebhooks[eventType as keyof typeof mockWebhooks];
    if (!webhookPayload) {
      return NextResponse.json(
        { error: 'Invalid event type. Use: payment.created, payment.succeeded, payment.failed, dispute.created' },
        { status: 400 }
      );
    }

    // Send the webhook to the actual webhook endpoint
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const responseText = await webhookResponse.text();
    
    console.log(`Test webhook ${eventType} sent:`, webhookPayload);
    console.log(`Webhook response:`, webhookResponse.status, responseText);

    return NextResponse.json({
      success: true,
      message: `Test webhook ${eventType} sent successfully`,
      webhookPayload,
      response: {
        status: webhookResponse.status,
        body: responseText
      }
    });

  } catch (error) {
    console.error('Error in webhook test:', error);
    return NextResponse.json(
      { error: 'Failed to send test webhook', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET endpoint to show available test options
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Test Endpoint',
    usage: 'POST to this endpoint with eventType and testAmount',
    availableEvents: [
      'payment.created',
      'payment.succeeded', 
      'payment.failed',
      'dispute.created'
    ],
    example: {
      method: 'POST',
      body: {
        eventType: 'payment.succeeded',
        testAmount: 25.00
      }
    }
  });
}
