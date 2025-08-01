# 📚 SkyBox API Documentation

This document provides detailed information about the API endpoints available in the SkyBox application.

## 🔗 Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.vercel.app`

## 🔐 Authentication

All API endpoints require proper authentication through Appwrite. The application handles authentication automatically through the client-side Appwrite SDK.

## 📋 API Endpoints

### Stripe Integration

#### Create Checkout Session

Creates a Stripe checkout session for subscription purchase.

```http
POST /api/stripe/create-checkout-session
```

**Request Body:**

```json
{
  "planId": "basic|pro|enterprise",
  "isTrial": false
}
```

**Response:**

```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Example:**

```bash
curl -X POST https://your-domain.vercel.app/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId": "pro", "isTrial": false}'
```

#### Stripe Webhook

Handles Stripe webhook events for subscription updates.

```http
POST /api/stripe/webhook
```

**Headers:**

- `stripe-signature`: Stripe webhook signature

**Events Handled:**

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `invoice.payment_succeeded`

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### Debug Endpoints

#### Test Webhook Configuration

Tests the webhook configuration and environment variables.

```http
GET /api/test-webhook
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

**Example:**

```bash
curl https://your-domain.vercel.app/api/test-webhook
```

#### Debug Subscriptions

Lists all current subscriptions in the database.

```http
POST /api/debug-webhook
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

**Example:**

```bash
curl -X POST https://your-domain.vercel.app/api/debug-webhook
```

## 🔧 Server Actions

### Subscription Actions

#### Start Trial

Starts a 14-day trial for the specified plan.

```typescript
import { startTrial } from '@/lib/actions/subscription.actions'

const result = await startTrial(planId: string)
```

**Parameters:**

- `planId`: The plan ID to start trial for (`basic`, `pro`, `enterprise`)

**Returns:**

```typescript
{
  success: boolean
  message: string
  subscription?: UserSubscription
}
```

#### Get User Subscription

Retrieves the current user's subscription status.

```typescript
import { getUserSubscription } from "@/lib/actions/subscription.actions";

const subscription = await getUserSubscription();
```

**Returns:**

```typescript
{
  success: boolean;
  subscription: UserSubscription | null;
  plan: PlanDetails;
  features: PlanFeatures;
}
```

## 📊 Data Models

### UserSubscription

```typescript
interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  createdAt: string;
  updatedAt: string;
}
```

### PlanDetails

```typescript
interface PlanDetails {
  id: string;
  name: string;
  price: number;
  storage: number;
  features: string[];
}
```

### PlanFeatures

```typescript
interface PlanFeatures {
  maxFileSize: number;
  maxFiles: number;
  advancedFeatures: boolean;
  prioritySupport: boolean;
}
```

## 🚨 Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "error": "Invalid request data",
  "message": "Missing required fields"
}
```

#### 401 Unauthorized

```json
{
  "error": "Authentication required",
  "message": "User not authenticated"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

### Stripe Errors

#### Webhook Signature Verification Failed

```json
{
  "error": "Webhook signature verification failed",
  "message": "Invalid stripe-signature header"
}
```

#### Invalid Event Type

```json
{
  "error": "Unhandled event type",
  "message": "Event type 'customer.subscription.deleted' not handled"
}
```

## 🔍 Testing

### Test Stripe Integration

1. **Create Test Payment:**

   ```bash
   curl -X POST https://your-domain.vercel.app/api/stripe/create-checkout-session \
     -H "Content-Type: application/json" \
     -d '{"planId": "basic", "isTrial": false}'
   ```

2. **Use Test Card Numbers:**

   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

3. **Check Webhook Processing:**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/debug-webhook
   ```

### Test Subscription Status

```bash
# Check webhook configuration
curl https://your-domain.vercel.app/api/test-webhook

# List all subscriptions
curl -X POST https://your-domain.vercel.app/api/debug-webhook
```

## 📝 Rate Limits

- **Stripe API**: Follows Stripe's rate limits
- **Appwrite API**: Follows Appwrite's rate limits
- **Webhook Endpoints**: No specific limits, but monitor for abuse

## 🔒 Security

### Webhook Security

- All webhook endpoints verify Stripe signatures
- Environment variables are properly secured
- No sensitive data is logged

### API Security

- All endpoints require authentication
- CORS is properly configured
- Input validation is implemented

## 📞 Support

For API-related issues:

1. Check the [Troubleshooting](../README.md#troubleshooting) section
2. Review [Issues](https://github.com/lunabear27/skybox/issues)
3. Create a new issue with API details

---

**Need help?** Check out our [main documentation](../README.md) or [setup guide](./SETUP.md).
