const admin = require('firebase-admin');

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Validate required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase configuration. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
    }

    // Handle different private key formats for different environments
    let processedPrivateKey = privateKey;
    
    // Handle Vercel environment - replace literal \n with actual newlines
    if (privateKey.includes('\\n')) {
      processedPrivateKey = privateKey.replace(/\\n/g, '\n');
    }
    // Handle cases where newlines are already properly formatted
    else if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format. Expected PEM format.');
    }

    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey: processedPrivateKey,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId, // Explicitly set project ID
    });
    
    // Configure Firestore to ignore undefined values
    admin.firestore().settings({
      ignoreUndefinedProperties: true
    });
    
    console.log('Firebase Admin initialized successfully for project:', projectId);
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw error; // Re-throw to prevent silent failures
  }
}

export const db = admin.firestore();

// Helper functions for Firestore operations
export const collections = {
  tipConfigs: () => db.collection('tip_configs'),
  tipTransactions: () => db.collection('tip_transactions'),
  tipAnalytics: () => db.collection('tip_analytics'),
};

// Types for our database documents
export interface TipConfig {
  companyId: string;
  experienceId: string;
  tipAmounts: number[];
  welcomeMessage: string;
  productIds: Record<string, string>; // amount -> productId mapping
  createdAt: Date;
  updatedAt: Date;
}

export interface TipTransaction {
  id: string;
  companyId: string;
  experienceId: string;
  fromUserId: string;
  fromUsername: string;
  amount: number; // Original tip amount (gross)
  netAmount: number; // Amount after Whop fees
  companyAmount: number; // 80% of netAmount
  developerAmount: number; // 20% of netAmount
  feeAmount: number; // Whop processing fees
  status: 'pending' | 'completed' | 'failed';
  paymentId: string;
  productId: string;
  // Additional metadata from checkout
  tipperId?: string;
  tipperName?: string;
  experienceName?: string;
  createdAt: Date;
}

export interface TipAnalytics {
  companyId: string;
  totalTips: number;
  totalCreatorEarnings: number;
  totalDeveloperEarnings: number;
  tipCount: number;
  averageTipAmount: number;
  lastUpdated: Date;
}
