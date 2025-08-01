# 🔧 SkyBox Troubleshooting Guide

This guide helps you resolve common issues when setting up and running SkyBox.

## 🚨 Common Issues

### 1. Subscription Not Updating After Payment

**Symptoms:**

- Payment succeeds on Stripe
- Dashboard still shows "Free Plan"
- No subscription record in database

**Diagnosis Steps:**

1. **Check Webhook Configuration:**

   ```bash
   curl https://your-domain.vercel.app/api/test-webhook
   ```

2. **Debug Current Subscriptions:**

   ```bash
   curl -X POST https://your-domain.vercel.app/api/debug-webhook
   ```

3. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Functions → `/api/stripe/webhook`
   - Look for error messages

**Solutions:**

#### A. Webhook Not Configured

```bash
# 1. Go to Stripe Dashboard → Webhooks
# 2. Add endpoint: https://your-domain.vercel.app/api/stripe/webhook
# 3. Select events: checkout.session.completed, customer.subscription.created, etc.
# 4. Copy webhook secret to Vercel environment variables
```

#### B. Missing Environment Variables

```bash
# Add to Vercel environment variables:
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_SECRET_KEY=sk_test_your_secret_key
APPWRITE_SECRET_KEY=your_appwrite_secret_key
```

#### C. Manual Fix (Temporary)

```bash
# Find your User ID
npm run find-user-id

# Update subscription manually
npm run update-subscription

# Or use quick fix
node scripts/quick-fix-subscription.js
```

### 2. Appwrite Connection Issues

**Symptoms:**

- "Document with the requested ID could not be found"
- Authentication errors
- Database connection failures

**Diagnosis Steps:**

1. **Verify API Keys:**

   ```bash
   # Check if environment variables are set
   echo $NEXT_PUBLIC_APPWRITE_PROJECT_ID
   echo $APPWRITE_SECRET_KEY
   ```

2. **Test Appwrite Connection:**
   ```bash
   # Test webhook configuration
   curl https://your-domain.vercel.app/api/test-webhook
   ```

**Solutions:**

#### A. Invalid API Keys

```bash
# 1. Go to Appwrite Console → Settings → API Keys
# 2. Create new API key with proper scopes
# 3. Update environment variables
```

#### B. Missing Collections

```bash
# Run setup script
npm run setup-subscriptions
```

#### C. Permission Issues

```bash
# 1. Go to Appwrite Console → Databases → Collections
# 2. Check collection permissions
# 3. Ensure "Read/Write" for authenticated users
```

### 3. Stripe Payment Issues

**Symptoms:**

- Payment buttons not working
- Checkout session creation fails
- "Cannot find module" errors

**Diagnosis Steps:**

1. **Check Stripe Keys:**

   ```bash
   # Verify environment variables
   echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   echo $STRIPE_SECRET_KEY
   ```

2. **Test Stripe Connection:**
   ```bash
   # Test checkout session creation
   curl -X POST https://your-domain.vercel.app/api/stripe/create-checkout-session \
     -H "Content-Type: application/json" \
     -d '{"planId": "basic", "isTrial": false}'
   ```

**Solutions:**

#### A. Invalid Stripe Keys

```bash
# 1. Go to Stripe Dashboard → Developers → API Keys
# 2. Copy correct keys (test/live)
# 3. Update environment variables
```

#### B. Missing Products

```bash
# 1. Go to Stripe Dashboard → Products
# 2. Create products with IDs: basic, pro, enterprise
# 3. Set correct prices
```

#### C. Webhook URL Issues

```bash
# 1. Update webhook URL to your domain
# 2. Ensure HTTPS is used
# 3. Test webhook delivery
```

### 4. Build and Deployment Issues

**Symptoms:**

- Build fails on Vercel
- Environment variables not found
- TypeScript errors

**Diagnosis Steps:**

1. **Check Build Logs:**

   - Go to Vercel Dashboard → Deployments
   - Check build output for errors

2. **Verify Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure all variables are set

**Solutions:**

#### A. Missing Environment Variables

```bash
# Add all required variables to Vercel:
NEXT_PUBLIC_APPWRITE_ENDPOINT
NEXT_PUBLIC_APPWRITE_PROJECT_ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID
NEXT_PUBLIC_APPWRITE_COLLECTION_ID
APPWRITE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

#### B. TypeScript Errors

```bash
# Fix type errors locally first
npm run lint
npm run build
```

#### C. Dependency Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 5. User Authentication Issues

**Symptoms:**

- Users can't log in
- Session not persisting
- "User not found" errors

**Diagnosis Steps:**

1. **Check User ID:**

   ```bash
   npm run find-user-id
   ```

2. **Verify User Document:**
   ```bash
   # Check if user exists in Appwrite
   # Go to Appwrite Console → Users
   ```

**Solutions:**

#### A. User Not Created

```bash
# 1. Ensure user signs up properly
# 2. Check Appwrite authentication settings
# 3. Verify user document creation
```

#### B. Session Issues

```bash
# 1. Clear browser cache
# 2. Check Appwrite session settings
# 3. Verify domain configuration
```

## 🛠️ Debug Tools

### Available Scripts

```bash
# Find User ID
npm run find-user-id

# Manual subscription update
npm run update-subscription

# Quick fix subscription
node scripts/quick-fix-subscription.js

# Setup subscriptions collection
npm run setup-subscriptions
```

### API Endpoints

```bash
# Test webhook configuration
curl https://your-domain.vercel.app/api/test-webhook

# Debug subscriptions
curl -X POST https://your-domain.vercel.app/api/debug-webhook

# Test checkout session
curl -X POST https://your-domain.vercel.app/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId": "basic", "isTrial": false}'
```

### Browser Console

Check browser console for:

- Authentication errors
- API request failures
- Subscription status logs

## 📊 Monitoring

### Vercel Function Logs

1. Go to Vercel Dashboard → Functions
2. Check `/api/stripe/webhook` logs
3. Look for error messages and stack traces

### Stripe Dashboard

1. Go to Stripe Dashboard → Webhooks
2. Check webhook delivery status
3. View failed webhook attempts

### Appwrite Console

1. Go to Appwrite Console → Logs
2. Check for authentication errors
3. Monitor database operations

## 🔍 Step-by-Step Debugging

### When Payment Succeeds But Subscription Doesn't Update

1. **Check Webhook Configuration:**

   ```bash
   curl https://your-domain.vercel.app/api/test-webhook
   ```

2. **Verify Webhook Events:**

   - Go to Stripe Dashboard → Webhooks
   - Check if events are being sent
   - Look for failed deliveries

3. **Check Vercel Logs:**

   - Go to Vercel Dashboard → Functions
   - Check `/api/stripe/webhook` logs
   - Look for error messages

4. **Debug Database:**

   ```bash
   curl -X POST https://your-domain.vercel.app/api/debug-webhook
   ```

5. **Manual Fix:**
   ```bash
   npm run find-user-id
   npm run update-subscription
   ```

### When Build Fails

1. **Check Local Build:**

   ```bash
   npm run build
   ```

2. **Fix TypeScript Errors:**

   ```bash
   npm run lint
   ```

3. **Verify Dependencies:**

   ```bash
   npm install
   ```

4. **Check Environment Variables:**
   - Ensure all variables are set in Vercel
   - Verify variable names are correct

## 🆘 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Run diagnostic commands**
3. **Check logs and error messages**
4. **Try manual fixes**

### When Creating Issues

Include:

- **Error messages** (full text)
- **Steps to reproduce**
- **Environment** (local/production)
- **Logs** from Vercel/Stripe/Appwrite
- **What you've tried**

### Useful Links

- [Main Documentation](../README.md)
- [Setup Guide](./SETUP.md)
- [API Documentation](./API.md)
- [GitHub Issues](https://github.com/lunabear27/skybox/issues)

---

**Still stuck?** Create an issue on GitHub with detailed information about your problem.
