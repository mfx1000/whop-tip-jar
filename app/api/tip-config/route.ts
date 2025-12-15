import { NextRequest, NextResponse } from 'next/server';
import { collections, TipConfig } from '@/lib/firebase';
import { whopsdk } from '@/lib/whop-sdk';

// GET - Retrieve tip configuration for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const experienceId = searchParams.get('experienceId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const snapshot = await collections.tipConfigs()
      .where('companyId', '==', companyId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Return default configuration if none exists
      const defaultConfig: Partial<TipConfig> = {
        companyId,
        experienceId: experienceId || '',
        tipAmounts: [10, 20, 50],
        welcomeMessage: 'Thank you for your support! 🙏',
        productIds: {},
      };
      return NextResponse.json({ data: defaultConfig });
    }

    const doc = snapshot.docs[0];
    return NextResponse.json({ 
      data: { 
        id: doc.id, 
        ...doc.data() 
      } 
    });

  } catch (error) {
    console.error('Error fetching tip config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tip configuration' },
      { status: 500 }
    );
  }
}

// POST - Create or update tip configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, experienceId, tipAmounts, welcomeMessage } = body;

    if (!companyId || !tipAmounts || !Array.isArray(tipAmounts)) {
      return NextResponse.json(
        { error: 'Company ID and tip amounts are required' },
        { status: 400 }
      );
    }

    // Check if config already exists
    const existingSnapshot = await collections.tipConfigs()
      .where('companyId', '==', companyId)
      .limit(1)
      .get();

    const now = new Date();
    let productIds: Record<string, string> = {};

    // If updating existing config, get existing product IDs
    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      productIds = existingDoc.data()?.productIds || {};
    }

    // Create/update products for each tip amount with correct API structure
    for (const amount of tipAmounts) {
      const amountKey = amount.toString();
      
      // Only create new product if it doesn't exist
      if (!productIds[amountKey]) {
        try {
          // Create product with correct API structure
          const product = await whopsdk.products.create({
            company_id: companyId,
            title: `$${amount} Tip`,
            description: `Support creator with a $${amount} tip`,
            visibility: 'hidden',
          });
          
          // Create plan for the product
          const plan = await whopsdk.plans.create({
            company_id: companyId,
            product_id: product.id,
            plan_type: 'one_time',
            initial_price: amount * 100, // Whop uses cents
            currency: 'usd',
          });
          
          productIds[amountKey] = plan.id;
        } catch (productError) {
          console.error(`Error creating product for $${amount}:`, productError);
          // Continue with other amounts if one fails
        }
      }
    }

    const configData: Partial<TipConfig> = {
      companyId,
      experienceId: experienceId || '',
      tipAmounts,
      welcomeMessage: welcomeMessage || 'Thank you for your support! 🙏',
      productIds,
      updatedAt: now,
    };

    if (existingSnapshot.empty) {
      // Create new config
      configData.createdAt = now;
      const docRef = await collections.tipConfigs().add(configData);
      return NextResponse.json({ 
        success: true, 
        data: { id: docRef.id, ...configData }
      });
    } else {
      // Update existing config
      const docRef = existingSnapshot.docs[0].ref;
      await docRef.update(configData);
      return NextResponse.json({ 
        success: true, 
        data: { id: docRef.id, ...configData }
      });
    }

  } catch (error) {
    console.error('Error saving tip config:', error);
    return NextResponse.json(
      { error: 'Failed to save tip configuration' },
      { status: 500 }
    );
  }
}
