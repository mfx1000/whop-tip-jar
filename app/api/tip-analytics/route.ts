import { NextRequest, NextResponse } from 'next/server';
import { collections, TipAnalytics } from '@/lib/firebase';

// GET - Retrieve analytics for a company
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

    const snapshot = await collections.tipAnalytics()
      .where('companyId', '==', companyId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Return default analytics if none exists
      const defaultAnalytics: Partial<TipAnalytics> = {
        companyId,
        totalTips: 0,
        totalCreatorEarnings: 0,
        totalDeveloperEarnings: 0,
        tipCount: 0,
        averageTipAmount: 0,
        lastUpdated: new Date(),
      };
      return NextResponse.json({ data: defaultAnalytics });
    }

    const doc = snapshot.docs[0];
    return NextResponse.json({ 
      data: { 
        id: doc.id, 
        ...doc.data() 
      } 
    });

  } catch (error) {
    console.error('Error fetching tip analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tip analytics' },
      { status: 500 }
    );
  }
}

// POST - Update analytics (typically called from webhooks)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyId, 
      tipAmount, 
      companyAmount, 
      developerAmount,
      feeAmount 
    } = body;

    if (!companyId || tipAmount === undefined) {
      return NextResponse.json(
        { error: 'Company ID and tip amount are required' },
        { status: 400 }
      );
    }

    // Get existing analytics
    const existingSnapshot = await collections.tipAnalytics()
      .where('companyId', '==', companyId)
      .limit(1)
      .get();

    let newAnalytics: Partial<TipAnalytics>;

    if (existingSnapshot.empty) {
      // Create new analytics record
      newAnalytics = {
        companyId,
        totalTips: tipAmount,
        totalCreatorEarnings: companyAmount || tipAmount * 0.8,
        totalDeveloperEarnings: developerAmount || tipAmount * 0.2,
        tipCount: 1,
        averageTipAmount: tipAmount,
        lastUpdated: new Date(),
      };
      await collections.tipAnalytics().add(newAnalytics);
    } else {
      // Update existing analytics
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data() as TipAnalytics;
      
      newAnalytics = {
        totalTips: existingData.totalTips + tipAmount,
        totalCreatorEarnings: existingData.totalCreatorEarnings + (companyAmount || tipAmount * 0.8),
        totalDeveloperEarnings: existingData.totalDeveloperEarnings + (developerAmount || tipAmount * 0.2),
        tipCount: existingData.tipCount + 1,
        averageTipAmount: (existingData.totalTips + tipAmount) / (existingData.tipCount + 1),
        lastUpdated: new Date(),
      };
      
      await existingDoc.ref.update(newAnalytics);
    }

    return NextResponse.json({ 
      success: true, 
      data: newAnalytics 
    });

  } catch (error) {
    console.error('Error updating tip analytics:', error);
    return NextResponse.json(
      { error: 'Failed to update tip analytics' },
      { status: 500 }
    );
  }
}
