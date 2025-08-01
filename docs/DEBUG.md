# 🔧 SkyBox Debugging Guide

This guide contains all debugging tools and utilities for troubleshooting SkyBox issues.

## 🛠️ Available Debug Scripts

### Quick Commands

```bash
# Find your User ID
npm run find-user-id

# Manual subscription update
npm run update-subscription

# Quick fix subscription (for your specific user)
npm run quick-fix

# Setup subscriptions collection
npm run setup-subscriptions
```

### Direct Script Execution

```bash
# Find user ID
node scripts/find-user-id.js

# Quick fix subscription
node scripts/quick-fix-subscription.js

# Manual subscription update
node scripts/manual-update-subscription.js
```

## 🌐 API Debug Endpoints

### Test Webhook Configuration

```bash
curl https://your-domain.vercel.app/api/test-webhook
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook configuration check",
  "subscriptionsCollection": {
    "exists": true,
    "id": "68862c48003462862d18",
    "name": "subscriptions"
  },
  "environmentVariables": {
    "STRIPE_SECRET_KEY": true,
    "STRIPE_WEBHOOK_SECRET": true,
    "APPWRITE_SECRET_KEY": true
  }
}
```

### Debug Current Subscriptions

```bash
curl -X POST https://your-domain.vercel.app/api/debug-webhook
```

**Response:**

```json
{
  "success": true,
  "message": "Debug webhook - current subscriptions",
  "subscriptionsCollection": {
    "id": "68862c48003462862d18",
    "name": "subscriptions"
  },
  "totalSubscriptions": 1,
  "subscriptions": [
    {
      "id": "688c8e69...",
      "userId": "688c8b770027a3420fac",
      "planId": "pro",
      "status": "active",
      "currentPeriodStart": "2025-08-01T09:53:42.625Z",
      "currentPeriodEnd": "2025-08-31T09:53:42.626Z",
      "cancelAtPeriodEnd": false,
      "stripeSubscriptionId": "manual_pro_1733129622625",
      "createdAt": "2025-08-01T09:53:42.625Z",
      "updatedAt": "2025-08-01T09:53:42.625Z"
    }
  ]
}
```

### Test Stripe Checkout

```bash
curl -X POST https://your-domain.vercel.app/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId": "basic", "isTrial": false}'
```

## 🔍 Common Debug Scenarios

### 1. User Can't Find Their User ID

```bash
npm run find-user-id
```

This will list all users and highlight your specific user.

### 2. Subscription Not Updating After Payment

```bash
# Step 1: Check webhook configuration
curl https://your-domain.vercel.app/api/test-webhook

# Step 2: Check current subscriptions
curl -X POST https://your-domain.vercel.app/api/debug-webhook

# Step 3: Manual fix (if needed)
npm run quick-fix
```

### 3. Payment Succeeded But Status Still Shows "Free Plan"

```bash
# Quick fix for your user
npm run quick-fix

# Or manual update with specific details
npm run update-subscription
```

## 📊 Monitoring Tools

### Vercel Function Logs

1. Go to Vercel Dashboard → Functions
2. Check `/api/stripe/webhook` logs
3. Look for error messages

### Stripe Dashboard

1. Go to Stripe Dashboard → Webhooks
2. Check webhook delivery status
3. View failed webhook attempts

### Appwrite Console

1. Go to Appwrite Console → Logs
2. Check for authentication errors
3. Monitor database operations

## 🚨 Emergency Fixes

### Quick Subscription Fix

If a user's subscription is stuck, use the quick fix:

```bash
npm run quick-fix
```

This will:

- Find your user ID automatically
- Create/update your subscription to Pro plan
- Set status to active
- Set 30-day period

### Manual Subscription Update

For more control:

```bash
npm run update-subscription
```

This interactive script allows you to:

- Choose specific plan
- Set trial status
- Customize period dates

## 🔒 Security Notes

- Debug endpoints are safe for production
- No sensitive data is exposed
- All endpoints require proper authentication
- Scripts use your existing environment variables

## 📝 Console Log Management

### Environment-Based Logging

The application uses a smart logging system that automatically manages console logs based on the environment:

```bash
# Development - shows all logs
NODE_ENV=development

# Production - hides most logs
NODE_ENV=production

# Debug mode - shows debug logs even in production
NEXT_PUBLIC_DEBUG_MODE=true
```

### Available Log Types

- **📁 File logs** - File operations (development only)
- **📊 Storage logs** - Storage usage and subscription data (development only)
- **🔄 Loading logs** - Loading states and API calls (development only)
- **✅ Success logs** - Successful operations (development only)
- **🔍 Debug logs** - Detailed debugging info (debug mode only)
- **🚀 Action logs** - User actions and bulk operations (development only)

### Clean Up Console Logs

To automatically replace console.log statements with the logger:

```bash
npm run cleanup-logs
```

This will:

- Replace console.log patterns with appropriate logger methods
- Add logger imports where needed
- Maintain functionality while reducing production noise

## 📞 When to Use These Tools

### ✅ Use When:

- Payment succeeds but subscription doesn't update
- User can't find their subscription status
- Webhook configuration issues
- Customer support requests

### ❌ Don't Use For:

- Regular operations
- Automated processes
- Production monitoring (use proper monitoring instead)

---

**Need help?** Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) for more detailed solutions.
