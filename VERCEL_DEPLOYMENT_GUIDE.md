# Vercel Deployment Guide

This guide will help you securely deploy your TipJar app to Vercel without exposing any sensitive information.

## 🔒 **Security Setup Completed**

Your project is now configured for secure deployment:

- ✅ **.env.example**: Template file with placeholder values
- ✅ **.env.local**: Contains your actual secrets (gitignored)
- ✅ **.gitignore**: Excludes all sensitive files from version control
- ✅ **Firebase Key**: Service account JSON excluded from git

## 🚀 **Deployment Steps**

### 1. **Push to GitHub**

Your repository is now safe to push to GitHub:

```bash
git add .
git commit -m "Secure environment setup for deployment"
git push origin main
```

**What's included in the push:**
- ✅ All source code
- ✅ .env.example (template only)
- ✅ Configuration files

**What's excluded (secure):**
- ❌ .env.local (your actual secrets)
- ❌ .env.development (deleted)
- ❌ Firebase service account JSON files
- ❌ Any .env files with actual values

### 2. **Deploy to Vercel**

#### **Option A: Import from GitHub**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

#### **Option B: Vercel CLI**
```bash
npm i -g vercel
vercel --prod
```

### 3. **Set Environment Variables in Vercel**

In your Vercel dashboard, add these environment variables:

#### **Whop Configuration**
```
WHOP_API_KEY=apik_lVpxW3rGfrvWH_A2020207_C_b22596635c326b4578cba89955672a64ef9b619b475b09aca24c8ca5bb7bdd
WHOP_WEBHOOK_SECRET=get_this_after_creating_a_webhook_in_the_app_settings_screen
NEXT_PUBLIC_WHOP_APP_ID=app_LyPgMLLMkjhyNh
```

#### **Firebase Configuration**
```
FIREBASE_PROJECT_ID=tipjar-whop-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@tipjar-whop-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCR6IJbJB8PbWVs
UPAXCqjIQfUBuhVv7fxel91NsCTlIqCa60cqKdjJ5u5E+FVglhbWA+7KTcqsPuMq
M/pnIpBBkGfq2ARshpcVg6i4uSezouRkEMMlFCBQMPtwMRb63Zj+0iB34pqYDpgx
6EhQL252UDZ3b2B8lOB+PCu+9pcXtkr2tiG3Z64MteIwYRxWhdW7JzLOXt8B0U3C
/eu1FLCsKvIgkAMLbNlWH3aGmRn0ZbabRoBrmC+slQng5PJsP4nGRIF9ipR224df
gblucbcP6m7ctyz3knLEcUf8+KQPmIt6nxB5ZgFQ9dpyI+RZPMrIPq7sbuOZk4rn
mrZHf6bDAgMBAAECggEAAzGufjBG6HTh84JnacRh+Cr5d2rgwpfYc87/Q+QclVIy
EdzKAged0fhW3vZQvXyLo25n8SXNegJ7wUDCCoqcfdLwyMNR1XkHdavG1cRiihws
GRoE1kWf2iGNtOGzjxUAHxPv11quklrqggLrvQBM0BTmxwE5K4EBfmydczYSuKzM
dlh0zwDWdqGbE1RNlQefQkIn7z0KMCikvxfwaITuTB8vHmXIO2p1bI9BidKWILlz
ILtqkaNSke+7l/kdNInQiclwQ0KceBovf19+7pnPpn3/9DSaNQsU64Wb8SjOHNhi
3b0JUuM8n5Yn30hOsx8/UIw3bJiwX5IVFTLIOPfXAQKBgQDDAIk9AbhokxT/bqyn
nd2gBLv/ojnBcwRGmqnqp4nhq/ZagyI/bqyRV+vtqtA+kzJXPpR/RPyVJZpBKelK
nux8UTdOxl9nIw/E5ISElfXdRDQFl5bUSXP7JDgs7zwUkPQQOd/gcC3a7YN301Bp
yiOfOkJyltikDv1mDlPKJ3UWKQKBgQC/jJ0ak15a+4T7kjtuTDB8RtIQqdRxzg7F
EC0TDYqLPoN6i2yUxD3AjgU99bIGkNwVN9cBrSuBzApzl7CAQC0IDmTcs80CfmKr
1oeAXg+sD7NbjZeWuJhoLCS9iJthwgDYYCternjzci18S/+donQYg1zV4moPb4Bg
dOZP24J7CwKBgQCRtG/XNtbcxLHW3pKBuBKmg4MZ0tSG+HMEcoJuBHuhNQWhwgQw
E3k8LM7ryktJxmDCEc+RfTGi/OzpyZbDH61sVW7NbyJawhYXUuragXJLDIWz5ry
ymOwDvMumB9zWpATI7tlj0ykHf6y5SFbup99VWHbD12W0GCFBkWTcoIpaQKBgCDF
4Tdj0XgForocSfjUJlONFnHtbMDP/azv2JZy8apjVsGHy1skvGAOrIzuVbhT3qPu
uuW5iEEb9QnUAUngMRQ4yj8MsF3l2+IEwYhQD6Rjx085yZ7rFIB2VQ7sqZEvTU+4
HJOFjIIynd+vbRu+aNis2RxrMbRUYoWeWq19JDUDAoGBALxmL1FLDL+V1FQ1vyr2
T+qYu4+dbdfXVEOVHIgGG9Rk8gyosoJlQnH1ZTe3lMih1z8T0s98JAiqE84jN9Uk
klmL/ujmTWT6LC8ZnpR3quc0M4tWtqPWF8hxatY39WvzGhGBBDIWje9k0QgwSGX58
NCgk+oF90cc7Us5J1aDQr/h
-----END PRIVATE KEY-----
```

### 4. **Configure Webhook**

After deployment, set up your webhook:

1. Go to your Whop App Settings
2. Set Webhook URL: `https://your-domain.vercel.app/api/webhooks`
3. Add your webhook secret from environment variables

## 🔧 **Local Development**

For future development:

```bash
# Copy the template
cp .env.example .env.local

# Edit with your actual values
# .env.local is already configured with your current secrets
```

## 📋 **Deployment Checklist**

- [x] Environment variables secured in .env.local
- [x] .gitignore updated to exclude sensitive files
- [x] .env.example created for documentation
- [x] .env.development file removed
- [x] Firebase service account files excluded
- [ ] Repository pushed to GitHub
- [ ] Vercel environment variables configured
- [ ] Webhook URL updated in Whop settings
- [ ] Test deployment functionality

## 🛡️ **Security Notes**

### ✅ **Safe to Commit**
- `.env.example` (template only)
- Source code files
- Configuration files without secrets
- README and documentation

### ❌ **Never Commit**
- `.env.local` (contains real secrets)
- Any `.env` files with actual values
- Firebase service account JSON files
- API keys or secrets

### 🔒 **Best Practices**
- Use different secrets for development and production
- Rotate API keys periodically
- Monitor webhook logs for security
- Use Vercel's environment variable encryption

## 🚨 **Troubleshooting**

### **Build Errors**
- Check all environment variables are set in Vercel
- Ensure Firebase private key formatting is correct
- Verify API key formats

### **Runtime Errors**
- Check Vercel function logs
- Verify webhook configuration
- Test API endpoints individually

### **Permission Issues**
- Check Firebase service account permissions
- Verify Whop API key scopes
- Ensure webhook URL is accessible

## 🎯 **Post-Deployment**

1. **Test All Features**: Dashboard, TipJar experience, webhooks
2. **Monitor Analytics**: Check Vercel analytics and error logs
3. **Update Webhook**: Set production webhook URL in Whop
4. **Backup Configuration**: Keep local copy of environment variables

Your app is now ready for secure deployment to Vercel! 🚀
