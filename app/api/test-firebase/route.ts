import { NextResponse } from 'next/server';
import { collections } from '@/lib/firebase';

export async function GET() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test write
    const testDoc = await collections.tipConfigs().add({
      test: true,
      createdAt: new Date(),
      companyId: 'test-company'
    });
    
    // Test read
    const snapshot = await collections.tipConfigs().limit(1).get();
    
    // Clean up
    await testDoc.delete();
    
    console.log('Firebase test passed!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase is working correctly!',
      documentsFound: snapshot.size,
      projectId: process.env.FIREBASE_PROJECT_ID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId: process.env.FIREBASE_PROJECT_ID,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
