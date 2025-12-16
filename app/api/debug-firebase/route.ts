import { NextRequest, NextResponse } from 'next/server';
import { collections } from '@/lib/firebase';

export async function GET() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test 1: Check if we can access Firestore
    const testDoc = {
      test: true,
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    };
    
    // Test 2: Try to write to a test collection
    const testRef = await collections.tipTransactions().add(testDoc);
    console.log('✅ Firebase write successful:', testRef.id);
    
    // Test 3: Try to read it back
    const readDoc = await testRef.get();
    console.log('✅ Firebase read successful:', readDoc.exists);
    
    // Test 4: Clean up
    await testRef.delete();
    console.log('✅ Firebase delete successful');
    
    // Test 5: Check environment variables
    const envCheck = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing',
      FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
    };
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connection test passed',
      environment: envCheck,
      testResults: {
        write: '✅ Success',
        read: '✅ Success', 
        delete: '✅ Success'
      }
    });
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing',
        FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL ? '✅ Set' : '❌ Missing',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
      }
    }, { status: 500 });
  }
}
