# 🛠️ SkyBox Setup Guide

This guide will walk you through setting up SkyBox from scratch, including all necessary configurations for Appwrite, Stripe, and deployment.

## 📋 Prerequisites

Before you begin, make sure you have:

- [Node.js](https://nodejs.org/) 18+ installed
- [Git](https://git-scm.com/) installed
- A code editor (VS Code recommended)
- Accounts for:
  - [Appwrite](https://appwrite.io/) (free tier available)
  - [Stripe](https://stripe.com/) (free to start)
  - [Vercel](https://vercel.com/) (free tier available)

## 🚀 Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/lunabear27/skybox.git
cd skybox

# Install dependencies
npm install
```

### 2. Appwrite Setup

#### Create Appwrite Project

1. Go to [Appwrite Console](https://console.appwrite.io/)
2. Create a new project
3. Note down your **Project ID**

#### Create Database

1. In your Appwrite project, go to **Databases**
2. Create a new database
3. Note down your **Database ID**

#### Create Collections

You'll need three collections:

##### Users Collection

- **Collection ID**: `users`
- **Name**: Users
- **Permissions**: Read/Write for authenticated users

##### Files Collection

- **Collection ID**: `files`
- **Name**: Files
- **Permissions**: Read/Write for authenticated users

##### Subscriptions Collection

- **Collection ID**: `subscriptions`
- **Name**: Subscriptions
- **Permissions**: Read/Write for authenticated users

**Attributes for Subscriptions Collection:**

- `userId` (String, Required)
- `planId` (String, Required)
- `status` (String, Required)
- `currentPeriodStart` (DateTime, Required)
- `currentPeriodEnd` (DateTime, Required)
- `cancelAtPeriodEnd` (Boolean, Required)
- `stripeSubscriptionId` (String, Required)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

#### Get API Keys

1. Go to **Settings** → **API Keys**
2. Create a new API key with the following scopes:
   - `databases.read`
   - `databases.write`
   - `users.read`
   - `users.write`
   - `files.read`
   - `files.write`
3. Copy the **Secret Key**

### 3. Stripe Setup

#### Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Switch to test mode for development

#### Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy your **Publishable Key** and **Secret Key**

#### Create Products

1. Go to **Products** → **Add Product**
2. Create three products:

**Basic Plan**

- Name: Basic Plan
- Price: $5.00/month
- Product ID: `basic`

**Pro Plan**

- Name: Pro Plan
- Price: $15.00/month
- Product ID: `pro`

**Enterprise Plan**

- Name: Enterprise Plan
- Price: $50.00/month
- Product ID: `enterprise`

#### Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
5. Copy the **Webhook Secret**

### 4. Environment Configuration

Create a `.env.local` file in your project root:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=your_collection_id
APPWRITE_SECRET_KEY=your_secret_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Setup Scripts

```bash
# Setup Stripe configuration
npm run setup-stripe

# Setup environment variables
npm run setup-env

# Setup subscriptions collection
npm run setup-subscriptions
```

### 6. Test Local Development

```bash
# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to test your application.

## 🚀 Deployment to Vercel

### 1. Connect to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2. Environment Variables

Add all environment variables from your `.env.local` file to Vercel:

1. Go to your project settings in Vercel
2. Navigate to **Environment Variables**
3. Add each variable with the production values

**Important**: Update `NEXT_PUBLIC_APP_URL` to your Vercel domain.

### 3. Deploy

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Update your Stripe webhook URL to your Vercel domain

## 🔧 Verification Steps

### Test Appwrite Connection

```bash
# Test webhook configuration
curl https://your-domain.vercel.app/api/test-webhook
```

### Test Stripe Integration

1. Go to your deployed app
2. Try to start a trial or purchase a plan
3. Check if subscription is created in Appwrite

### Debug Issues

```bash
# Check current subscriptions
curl -X POST https://your-domain.vercel.app/api/debug-webhook

# Find user ID
npm run find-user-id

# Manual subscription update
npm run update-subscription
```

## 🐛 Common Issues

### Subscription Not Updating

1. Check webhook configuration in Stripe
2. Verify webhook secret in environment variables
3. Check Vercel function logs for errors

### Appwrite Connection Issues

1. Verify API keys and project ID
2. Check collection permissions
3. Ensure database and collections exist

### Stripe Payment Issues

1. Verify API keys are correct
2. Check if products exist in Stripe
3. Ensure webhook endpoint is accessible

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](../README.md#troubleshooting) section
2. Review [Issues](https://github.com/lunabear27/skybox/issues)
3. Create a new issue with detailed information

---

**Need help?** Check out our [main documentation](../README.md) or create an issue on GitHub.
