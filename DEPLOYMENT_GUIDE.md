# 🚀 SkyBox Deployment Guide

This guide will help you deploy your SkyBox application to various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Appwrite Project** - Set up with database, storage, and collections
2. **Stripe Account** - Configured with products and webhooks
3. **Environment Variables** - All required variables configured
4. **Domain** (optional) - For production deployment

## 🔧 Environment Variables Setup

Create a `.env.local` file with the following variables:

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your_users_collection_id
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID=your_files_collection_id
NEXT_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id
APPWRITE_SECRET_KEY=your_secret_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Deploy:**

   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**

   - Go to your project settings
   - Add all environment variables from `.env.local`

4. **Configure Custom Domain (Optional):**
   - Add your domain in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` to your domain

### Option 2: Netlify

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add environment variables in Netlify dashboard

### Option 3: Railway

1. **Connect GitHub repository**
2. **Set environment variables**
3. **Deploy automatically**

### Option 4: DigitalOcean App Platform

1. **Connect your repository**
2. **Configure build settings**
3. **Set environment variables**
4. **Deploy**

## 🔗 Post-Deployment Setup

### 1. Update Stripe Webhook Endpoint

After deployment, update your Stripe webhook endpoint:

```
https://your-domain.com/api/stripe/webhook
```

### 2. Update Appwrite Settings

1. **Add your domain to Appwrite allowed origins:**

   - Go to Appwrite Console → Settings → Security
   - Add your production domain

2. **Update redirect URLs:**
   - Add your production URLs to authentication settings

### 3. Test the Application

1. **Test user registration/login**
2. **Test file upload functionality**
3. **Test Stripe payment flow**
4. **Test webhook functionality**

## 🛠️ Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading:**

   - Ensure all variables are set in your deployment platform
   - Check for typos in variable names

2. **Appwrite Connection Issues:**

   - Verify project ID and API keys
   - Check if domain is added to allowed origins

3. **Stripe Webhook Failures:**

   - Verify webhook endpoint URL
   - Check webhook secret
   - Test webhook delivery in Stripe dashboard

4. **File Upload Issues:**
   - Verify bucket permissions
   - Check storage configuration

## 📊 Monitoring

### Recommended Tools:

1. **Vercel Analytics** - Performance monitoring
2. **Sentry** - Error tracking
3. **Stripe Dashboard** - Payment monitoring
4. **Appwrite Console** - Backend monitoring

## 🔒 Security Checklist

- [ ] Environment variables are properly set
- [ ] Appwrite security rules configured
- [ ] Stripe webhook signature verification enabled
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented (if needed)

## 🚀 Quick Deploy Commands

```bash
# Build for production
npm run build

# Test production build locally
npm start

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod
```

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section
2. Review deployment platform logs
3. Verify all environment variables
4. Test locally with production environment variables

---

**Happy Deploying! 🎉**
