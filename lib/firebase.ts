const admin = require('firebase-admin');

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Note: Firestore doesn't use databaseURL - it uses project ID
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
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
  amount: number;
  creatorAmount: number;
  developerAmount: number;
  whopFee: number;
  status: 'pending' | 'completed' | 'failed';
  paymentId: string;
  productId: string;
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
