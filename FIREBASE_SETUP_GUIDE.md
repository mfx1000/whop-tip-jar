# Firebase Setup Guide for TipJar App

## 🚀 Quick Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Project name: `tipjar-app-project` (or your preferred name)
4. Continue through setup steps
5. Select **"Create project"**

### 2. Enable Firestore Database

1. In your Firebase project, go to **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select a location (choose closest to your users)
5. Click **"Enable"**

### 3. Get Service Account Credentials

1. Go to **Project Settings** (⚙️ icon) → **"Service accounts"**
2. Click **"Generate new private key"**
3. Select **"JSON"** format
4. Click **"Create and download"**
5. Open the downloaded JSON file and copy these values:

```json
{
  "project_id": "your-project-id",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com", 
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

### 4. Update Environment Variables

Replace the placeholder values in `.env.development`:

```env
# Firebase Configuration
# Note: Firestore only needs project ID, not database URL
FIREBASE_PROJECT_ID="your-actual-project-id"
FIREBASE_CLIENT_EMAIL="your-actual-service-account-email"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important**: Firestore (which we're using) doesn't use `FIREBASE_DATABASE_URL`. That URL is for the older Firebase Realtime Database. Firestore uses the project ID from the service account credentials.

### 5. Set Security Rules

Go to **Firestore Database** → **"Rules"** tab and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tip configurations - only company owners can read/write
    match /tip_configs/{doc} {
      allow read, write: if request.auth != null;
    }
    
    // Tip transactions - anyone can read company's transactions, webhooks can write
    match /tip_transactions/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Tip analytics - anyone can read company's analytics, webhooks can write  
    match /tip_analytics/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**For production**, implement stricter rules based on user authentication.

## 🔧 Testing Firebase Setup

### Test Database Connection

Create a test file to verify everything works:

```typescript
// app/api/test-firebase/route.ts
import { NextResponse } from 'next/server';
import { collections } from '@/lib/firebase';

export async function GET() {
  try {
    // Test write
    const testDoc = await collections.tipConfigs().add({
      test: true,
      createdAt: new Date()
    });
    
    // Test read
    const snapshot = await collections.tipConfigs().limit(1).get();
    
    // Clean up
    await testDoc.delete();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase is working correctly!',
      documentsFound: snapshot.size 
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

Test it: `http://localhost:3000/api/test-firebase`

## 📋 Common Issues & Solutions

### Issue: "Permission denied" errors
**Solution**: Check security rules and ensure they're published

### Issue: "App Not Authorized"  
**Solution**: Verify private key format and service account email

### Issue: "Project not found"
**Solution**: Double-check FIREBASE_PROJECT_ID matches exactly

### Issue: Private key format errors
**Solution**: Ensure newlines are properly escaped with `\n`

## 🚀 Next Steps After Setup

1. **Install Firebase CLI** (optional but helpful):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Test the API endpoints**:
   - `GET /api/tip-config?companyId=test`
   - `POST /api/tip-config` (with test data)
   - `GET /api/tip-analytics?companyId=test`

3. **Verify webhook processing**:
   - Set up webhook in Whop app settings
   - Test with actual payment

4. **Deploy to production**:
   - Update environment variables in production
   - Set proper security rules
   - Monitor database usage

## 🔐 Production Security Considerations

For production deployment, implement these additional measures:

### 1. Stricter Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access data
    match /tip_configs/{doc} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.ownerIds;
    }
    
    match /tip_transactions/{doc} {
      allow read: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
      allow write: if request.auth != null; // Webhook service
    }
    
    match /tip_analytics/{doc} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
  }
}
```

### 2. Environment Variables
- Use environment-specific config files
- Never commit secrets to version control
- Use secret management services in production

### 3. Database Indexes
Create composite indexes for common queries:
- `tip_transactions` → `(companyId, createdAt)`
- `tip_configs` → `(companyId)`

---

**Once Firebase is set up, you're ready to continue with Phase 3: Building the UI components!**
