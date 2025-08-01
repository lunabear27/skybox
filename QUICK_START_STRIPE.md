# 🚀 Quick Start: Stripe Integration

Get Stripe payments working in your SkyBox project in 5 minutes!

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Setup Script

```bash
npm run setup-stripe
```

This will guide you through entering your Stripe credentials and create your `.env.local` file.

### 3. Create Stripe Products

Go to [Stripe Dashboard](https://dashboard.stripe.com/) and create these products:

| Plan       | Price     | Description                    |
| ---------- | --------- | ------------------------------ |
| Basic      | $5/month  | 50 GB storage, unlimited files |
| Pro        | $15/month | 1 TB storage, priority support |
| Enterprise | $50/month | 10 TB storage, 24/7 support    |

### 4. Set Up Webhook

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
4. Copy the webhook secret (starts with `whsec_`)

### 5. Test the Integration

```bash
npm run dev
```

Visit your dashboard and try upgrading a plan!

## 🧪 Testing

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`

## 📚 Full Documentation

For detailed setup instructions, see: [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md)

## 🆘 Need Help?

1. Check the troubleshooting section in the full guide
2. Verify all environment variables are set correctly
3. Ensure webhook endpoint is accessible
4. Check browser console for any errors

## 🎉 What You Get

✅ **Secure payment processing** with Stripe Checkout  
✅ **Subscription management** with Customer Portal  
✅ **Real-time webhook handling** for subscription updates  
✅ **Automatic billing** and payment processing  
✅ **Test mode** for safe development

Your users can now upgrade their plans and manage their subscriptions seamlessly!
