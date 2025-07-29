# Subscription System Setup Guide

## Database Setup

### 1. Create Subscriptions Collection

Create a new collection in your Appwrite database with the following structure:

**Collection ID:** `subscriptions`

**Attributes:**

- `userId` (String, required) - User ID
- `planId` (String, required) - Plan ID (free, basic, pro, enterprise)
- `status` (String, required) - Subscription status (active, canceled, past_due, trialing, incomplete)
- `currentPeriodStart` (String, required) - Start date of current billing period
- `currentPeriodEnd` (String, required) - End date of current billing period
- `trialStart` (String, optional) - Trial start date
- `trialEnd` (String, optional) - Trial end date
- `cancelAtPeriodEnd` (Boolean, required) - Whether subscription will cancel at period end
- `stripeSubscriptionId` (String, optional) - Stripe subscription ID (for future payment integration)
- `stripeCustomerId` (String, optional) - Stripe customer ID (for future payment integration)
- `createdAt` (String, required) - Creation timestamp
- `updatedAt` (String, required) - Last update timestamp

### 2. Indexes

Create the following indexes for optimal performance:

1. **userId_status** (Compound index)

   - Attribute 1: `userId` (ASC)
   - Attribute 2: `status` (ASC)

2. **userId_createdAt** (Compound index)
   - Attribute 1: `userId` (ASC)
   - Attribute 2: `createdAt` (DESC)

### 3. Permissions

Set up the following permissions for the subscriptions collection:

**Read permissions:**

- Users can read their own subscriptions

**Write permissions:**

- Users can create their own subscriptions
- Users can update their own subscriptions

**Delete permissions:**

- Users can delete their own subscriptions (optional)

## Features

### Current Implementation

✅ **Subscription Management**

- Get user's current subscription
- Start free trials (14 days)
- Upgrade to paid plans
- Cancel subscriptions
- Plan comparison

✅ **Plan Features**

- Free Plan: 10 GB storage, 100 MB upload limit
- Basic Plan: 50 GB storage, 2 GB upload limit, $5/month
- Pro Plan: 1 TB storage, 10 GB upload limit, $15/month
- Enterprise Plan: 10 TB storage, unlimited upload, $50/month

✅ **UI Features**

- Real-time subscription status display
- Plan comparison table
- Trial management
- Subscription cancellation
- Loading states and error handling

### Future Enhancements

🔄 **Payment Integration**

- Stripe payment processing
- Secure payment handling
- Invoice generation
- Payment history

🔄 **Advanced Features**

- Annual billing discounts
- Team/workspace management
- Usage analytics
- Custom plan creation
- Promotional codes

🔄 **Email Notifications**

- Trial expiration reminders
- Payment failure notifications
- Subscription status updates
- Welcome emails

## Usage

### Starting a Trial

```typescript
const result = await startTrial("pro");
if (result.success) {
  console.log("Trial started:", result.message);
}
```

### Upgrading a Plan

```typescript
const result = await upgradePlan("pro");
if (result.success) {
  console.log("Plan upgraded:", result.message);
}
```

### Canceling Subscription

```typescript
const result = await cancelSubscription();
if (result.success) {
  console.log("Subscription canceled:", result.message);
}
```

### Checking Upload Permissions

```typescript
const result = await checkUploadPermission(fileSize);
if (result.success) {
  // User can upload this file
} else {
  // File too large for current plan
  console.log(result.error);
}
```

## Testing

1. **Test Free Plan**: Default for new users
2. **Test Trial**: Start trial for any plan
3. **Test Upgrade**: Upgrade from free to paid plan
4. **Test Downgrade**: Change between paid plans
5. **Test Cancel**: Cancel active subscription
6. **Test Limits**: Try uploading files larger than plan limits

## Security Notes

- All subscription operations are server-side actions
- User can only access their own subscription data
- Plan limits are enforced on both client and server
- Trial abuse prevention (one trial per user)
- Secure session handling for user identification
