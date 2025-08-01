# Stripe Payment Integration Setup Guide

## 🚀 Quick Start

This guide will help you set up Stripe payment integration for your SkyBox project.

## 📋 Prerequisites

1. **Stripe Account**: Create a [Stripe account](https://dashboard.stripe.com/register)
2. **Node.js & npm**: Ensure you have the latest LTS version
3. **SkyBox Project**: Your project should be running locally

## 🔧 Step 1: Install Dependencies

The Stripe dependencies have already been added to your `package.json`. Run:

```bash
npm install
```

## 🔑 Step 2: Set Up Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (you'll get these from Step 3)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Optional: Annual pricing (for future implementation)
STRIPE_BASIC_ANNUAL_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🛒 Step 3: Create Stripe Products & Prices

### 3.1 Access Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **Test mode** (toggle in the top right)

### 3.2 Create Products

Create the following products in your Stripe dashboard:

#### Basic Plan

- **Name**: Basic Plan
- **Description**: 50 GB storage, unlimited files, email support
- **Price**: $5/month

#### Pro Plan

- **Name**: Pro Plan
- **Description**: 1 TB storage, unlimited files, priority support
- **Price**: $15/month

#### Enterprise Plan

- **Name**: Enterprise Plan
- **Description**: 10 TB storage, unlimited files, 24/7 support
- **Price**: $50/month

### 3.3 Get Price IDs

After creating each product, copy the **Price ID** (starts with `price_`) and add it to your `.env.local` file.

## 🌐 Step 4: Set Up Webhooks

### 4.1 Create Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
4. For local development: Use [Stripe CLI](#stripe-cli-setup) or [ngrok](https://ngrok.com/)

### 4.2 Select Events

Add these events to your webhook:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 4.3 Get Webhook Secret

Copy the **Signing secret** (starts with `whsec_`) and add it to your `.env.local` file.

## 🔧 Step 5: Stripe CLI Setup (Optional for Local Development)

### 5.1 Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
# Download from https://github.com/stripe/stripe-cli/releases

# Linux
# Download from https://github.com/stripe/stripe-cli/releases
```

### 5.2 Login to Stripe

```bash
stripe login
```

### 5.3 Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret starting with `whsec_`. Use this in your `.env.local` for local development.

## 🧪 Step 6: Test the Integration

### 6.1 Test Cards

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### 6.2 Test the Flow

1. Start your development server: `npm run dev`
2. Go to your dashboard and try to upgrade a plan
3. Use a test card to complete the payment
4. Check that the subscription is created in your database

## 🔍 Step 7: Verify Setup

### 7.1 Check Environment Variables

Run this command to validate your setup:

```bash
npm run build
```

If there are any missing environment variables, the build will fail with clear error messages.

### 7.2 Test API Endpoints

Test your API endpoints:

```bash
# Test checkout session creation
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId": "basic"}'

# Test portal session creation
curl -X POST http://localhost:3000/api/stripe/create-portal-session \
  -H "Content-Type: application/json"
```

## 🚀 Step 8: Production Deployment

### 8.1 Update Environment Variables

For production, update your environment variables:

```env
# Use live keys instead of test keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Update webhook URL
STRIPE_WEBHOOK_SECRET=whsec_... # From production webhook
```

### 8.2 Update Webhook URL

In your Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Update the endpoint URL to your production domain
3. Copy the new webhook secret

### 8.3 Deploy

Deploy your application with the updated environment variables.

## 🔧 Troubleshooting

### Common Issues

1. **"Missing required Stripe environment variables"**

   - Check that all environment variables are set in `.env.local`
   - Restart your development server after adding variables

2. **"Invalid signature" in webhooks**

   - Ensure webhook secret is correct
   - For local development, use Stripe CLI or ngrok

3. **"No Stripe customer found"**

   - User must have a Stripe customer ID
   - This is created automatically on first checkout

4. **"Invalid plan ID"**
   - Check that price IDs in `.env.local` match your Stripe dashboard
   - Ensure plan IDs match those in `lib/types/subscription.ts`

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
DEBUG=stripe:*
```

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Components](https://stripe.com/docs/stripe-js/react)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## 🎉 Success!

Once you've completed all steps, your SkyBox application will have:

✅ **Secure payment processing** with Stripe Checkout  
✅ **Subscription management** with Customer Portal  
✅ **Real-time webhook handling** for subscription updates  
✅ **Automatic billing** and payment processing  
✅ **Test mode** for safe development

Your users can now upgrade their plans and manage their subscriptions seamlessly!
