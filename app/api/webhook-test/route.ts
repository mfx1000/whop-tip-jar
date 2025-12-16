import { NextRequest, NextResponse } from 'next/server';

// Test webhook endpoint for local development
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      eventType, 
      testAmount = 10.00,
      companyId = 'biz_test_company_id',
      experienceId = 'exp_test_id',
      experienceName = 'Test Experience',
      tipperId = 'user_test_tipper_id',
      tipperName = 'Test Tipper',
      tipperUsername = 'testtipper'
    } = body;

    // Create mock webhook payloads for testing
    const mockWebhooks = {
      'payment.created': {
        type: 'payment.created',
        data: {
          id: 'pay_test_' + Date.now(),
          amount: testAmount * 100, // Convert to cents
          company: { id: companyId },
          user: { 
            id: tipperId,
            username: tipperUsername
          },
          checkout: {
            metadata: {
              experienceId: experienceId,
              experienceName: experienceName,
              tipperId: tipperId,
              tipperName: tipperName
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
          amount_after_fees: Math.round((testAmount - testAmount * 0.2) * 100), // After 20% fee
          fee_amount: Math.round(testAmount * 0.2 * 100), // 20% platform fee
          company: { id: companyId },
          user: { 
            id: tipperId,
            username: tipperUsername
          },
          checkout: {
            metadata: {
              experienceId: experienceId,
              experienceName: experienceName,
              tipperId: tipperId,
              tipperName: tipperName
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
          company: { id: companyId },
          user: { 
            id: tipperId,
            username: tipperUsername
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
          company: { id: companyId },
          user: { 
            id: tipperId,
            username: tipperUsername
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

    // Send webhook to the actual webhook endpoint
    const webhookUrl = request.url.includes('localhost') 
      ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks`
      : 'https://whop-tip-jar.vercel.app/api/webhooks';
    
    const webhookResponse = await fetch(webhookUrl, {
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

// NEW: Complete payment flow simulation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      testAmount = 25.00,
      companyId = 'biz_test_company_id',
      experienceId = 'exp_test_id',
      experienceName = 'Test Experience',
      tipperId = 'user_test_tipper_id',
      tipperName = 'Test Tipper',
      tipperUsername = 'testtipper'
    } = body;

    const timestamp = Date.now();
    
    // Simulate complete payment flow: created -> succeeded
    const paymentId = 'pay_test_' + timestamp;
    
    const paymentCreated = {
      type: 'payment.created',
      data: {
        id: paymentId,
        amount: testAmount * 100,
        company: { id: companyId },
        user: { 
          id: tipperId,
          username: tipperUsername
        },
        checkout: {
          metadata: {
            experienceId: experienceId,
            experienceName: experienceName,
            tipperId: tipperId,
            tipperName: tipperName
          }
        },
        created_at: new Date().toISOString()
      }
    };

    const paymentSucceeded = {
      type: 'payment.succeeded',
      data: {
        id: paymentId,
        amount: testAmount * 100,
        amount_after_fees: Math.round((testAmount - testAmount * 0.2) * 100),
        fee_amount: Math.round(testAmount * 0.2 * 100),
        company: { id: companyId },
        user: { 
          id: tipperId,
          username: tipperUsername
        },
        checkout: {
          metadata: {
            experienceId: experienceId,
            experienceName: experienceName,
            tipperId: tipperId,
            tipperName: tipperName
          }
        },
        created_at: new Date().toISOString()
      }
    };

    // Send both webhooks in sequence
    const webhookUrl = request.url.includes('localhost') 
      ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks`
      : 'https://whop-tip-jar.vercel.app/api/webhooks';

    const createdResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentCreated)
    });

    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

    const succeededResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentSucceeded)
    });

    const createdText = await createdResponse.text();
    const succeededText = await succeededResponse.text();

    console.log('Complete payment flow simulation:', {
      created: { status: createdResponse.status, body: createdText },
      succeeded: { status: succeededResponse.status, body: succeededText }
    });

    return NextResponse.json({
      success: true,
      message: 'Complete payment flow simulated successfully',
      paymentId,
      testAmount,
      results: {
        paymentCreated: {
          status: createdResponse.status,
          body: createdText
        },
        paymentSucceeded: {
          status: succeededResponse.status,
          body: succeededText
        }
      }
    });

  } catch (error) {
    console.error('Error in complete payment flow test:', error);
    return NextResponse.json(
      { error: 'Failed to simulate complete payment flow', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET endpoint to show available test options
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Test Endpoint',
    usage: 'Use POST for single events, PUT for complete payment flow',
    availableEvents: [
      'payment.created',
      'payment.succeeded', 
      'payment.failed',
      'dispute.created'
    ],
    testOptions: {
      singleEvent: {
        method: 'POST',
        body: {
          eventType: 'payment.succeeded',
          testAmount: 25.00,
          companyId: 'your_company_id',
          experienceId: 'your_experience_id',
          experienceName: 'Your Experience',
          tipperId: 'user_tipper_id',
          tipperName: 'Test Tipper',
          tipperUsername: 'testtipper'
        }
      },
      completeFlow: {
        method: 'PUT',
        body: {
          testAmount: 25.00,
          companyId: 'your_company_id',
          experienceId: 'your_experience_id',
          experienceName: 'Your Experience',
          tipperId: 'user_tipper_id',
          tipperName: 'Test Tipper',
          tipperUsername: 'testtipper'
        }
      }
    }
  });
}
