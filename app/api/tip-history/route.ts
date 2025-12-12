import { NextRequest, NextResponse } from 'next/server';
import { collections, TipTransaction } from '@/lib/firebase';

// GET - Retrieve transaction history for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Query transactions for company, ordered by most recent
    // First get all transactions for company
    const snapshot = await collections.tipTransactions()
      .where('companyId', '==', companyId)
      .get();
    
    // Then sort and paginate in memory (to avoid composite index requirement)
    let transactions = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firebase Timestamp to ISO string for proper client-side parsing
        createdAt: data.createdAt?.toMillis ? new Date(data.createdAt.toMillis()).toISOString() : data.createdAt
      };
    });
    
    // Sort by createdAt descending
    transactions.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    
    // Apply pagination
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    return NextResponse.json({ 
      data: paginatedTransactions,
      pagination: {
        limit,
        offset,
        hasMore: paginatedTransactions.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching tip history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tip history' },
      { status: 500 }
    );
  }
}

// POST - Create a new transaction record (typically called from webhooks)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyId,
      experienceId,
      fromUserId,
      fromUsername,
      amount,
      creatorAmount,
      developerAmount,
      whopFee,
      paymentId,
      productId,
      status = 'completed'
    } = body;

    if (!companyId || !fromUserId || !amount || !paymentId) {
      return NextResponse.json(
        { error: 'Company ID, user ID, amount, and payment ID are required' },
        { status: 400 }
      );
    }

    // Check if transaction already exists (prevent duplicates)
    const existingSnapshot = await collections.tipTransactions()
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction already recorded',
        data: existingSnapshot.docs[0].data()
      });
    }

    const transaction: Partial<TipTransaction> = {
      companyId,
      experienceId: experienceId || '',
      fromUserId,
      fromUsername: fromUsername || 'Anonymous',
      amount,
      creatorAmount: creatorAmount || amount * 0.8,
      developerAmount: developerAmount || amount * 0.2,
      whopFee: whopFee || amount * 0.029 + 0.30, // Standard Stripe-like fee estimate
      status: status as 'pending' | 'completed' | 'failed',
      paymentId,
      productId: productId || '',
      createdAt: new Date(),
    };

    const docRef = await collections.tipTransactions().add(transaction);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        id: docRef.id, 
        ...transaction 
      }
    });

  } catch (error) {
    console.error('Error creating tip transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create tip transaction' },
      { status: 500 }
    );
  }
}

// PATCH - Update transaction status (for failed/retry scenarios)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Payment ID and status are required' },
        { status: 400 }
      );
    }

    const snapshot = await collections.tipTransactions()
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.update({ 
      status: status as 'pending' | 'completed' | 'failed',
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction status updated successfully'
    });

  } catch (error) {
    console.error('Error updating transaction status:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction status' },
      { status: 500 }
    );
  }
}
