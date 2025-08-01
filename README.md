# 🚀 SkyBox - Cloud Storage with Stripe Integration

A modern cloud storage application built with Next.js, Appwrite, and Stripe payment integration. Features file management, subscription plans, and secure payment processing.

## 🌐 Demo Site

**Live Demo**: [https://skybox-pi.vercel.app](https://skybox-pi.vercel.app)

Experience SkyBox in action with full functionality including:
- 📁 File upload and management
- 💳 Stripe payment integration
- 🔐 User authentication
- 📊 Storage analytics
- 🎯 14-day trial system

## ✨ Features

- **📁 File Management**: Upload, organize, and manage your files
- **💳 Subscription Plans**: Basic, Pro, and Enterprise plans with Stripe integration
- **🎯 14-Day Trials**: Start with a free trial before committing
- **🔐 Secure Authentication**: User authentication with Appwrite
- **📊 Storage Analytics**: Track your storage usage
- **🎨 Modern UI**: Beautiful, responsive design with Tailwind CSS
- **⚡ Real-time Updates**: Live subscription status updates

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Appwrite (BaaS)
- **Payments**: Stripe
- **Styling**: Tailwind CSS, DaisyUI
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Appwrite account
- Stripe account
- Vercel account (for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/lunabear27/skybox.git
cd skybox
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

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

### 4. Setup Scripts

Run the setup scripts to configure your environment:

```bash
# Setup Stripe configuration
npm run setup-stripe

# Setup environment variables
npm run setup-env

# Setup subscriptions collection
npm run setup-subscriptions
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 📋 Project Structure

```
skybox/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── stripe/               # Stripe API endpoints
│   │   │   ├── create-checkout-session/
│   │   │   └── webhook/
│   │   ├── test-webhook/         # Webhook testing
│   │   └── debug-webhook/        # Debug subscriptions
│   ├── dashboard/                # Dashboard pages
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── DashboardLayout.tsx       # Main dashboard layout
│   ├── DashboardContentFixed.tsx # Dashboard content
│   └── ui/                       # UI components
├── lib/                          # Utility libraries
│   ├── actions/                  # Server actions
│   │   └── subscription.actions.ts
│   ├── appwrite/                 # Appwrite configuration
│   ├── stripe/                   # Stripe configuration
│   └── types/                    # TypeScript types
├── scripts/                      # Setup and utility scripts
│   ├── setup-stripe.js           # Stripe setup
│   ├── setup-env.js              # Environment setup
│   ├── setup-subscriptions-collection.js
│   ├── manual-update-subscription.js
│   ├── quick-fix-subscription.js
│   └── find-user-id.js
└── public/                       # Static assets
```

## 💳 Stripe Integration

### Setup Stripe

1. **Create Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Get API Keys**: From Stripe Dashboard → Developers → API Keys
3. **Create Products**: Create Basic, Pro, and Enterprise products
4. **Configure Webhooks**: Add webhook endpoint for subscription updates

### Webhook Configuration

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
4. Copy webhook secret to environment variables

### Subscription Plans

| Plan       | Price     | Storage | Features                            |
| ---------- | --------- | ------- | ----------------------------------- |
| Basic      | $5/month  | 100 GB  | Basic file management               |
| Pro        | $15/month | 1 TB    | Advanced features, priority support |
| Enterprise | $50/month | 10 TB   | Custom solutions, dedicated support |

## 🗄️ Appwrite Configuration

### Required Collections

1. **users**: User profiles and authentication
2. **files**: File metadata and storage information
3. **subscriptions**: User subscription status and plan details

### Database Schema

#### Subscriptions Collection

```json
{
  "userId": "string",
  "planId": "string",
  "status": "string",
  "currentPeriodStart": "datetime",
  "currentPeriodEnd": "datetime",
  "cancelAtPeriodEnd": "boolean",
  "stripeSubscriptionId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Setup Scripts
npm run setup-stripe           # Configure Stripe
npm run setup-env              # Setup environment
npm run setup-subscriptions    # Create subscriptions collection

# Utility Scripts
npm run update-subscription    # Manual subscription update
npm run find-user-id           # Find user ID
```

## 🚀 Deployment

### Deploy to Vercel

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Environment Variables**: Add all environment variables in Vercel dashboard
3. **Deploy**: Vercel will automatically deploy on push to main branch

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `NEXT_PUBLIC_APPWRITE_COLLECTION_ID`
- `APPWRITE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

## 🔧 Troubleshooting

For detailed troubleshooting and debugging tools, see our comprehensive guides:

- **[Debugging Guide](docs/DEBUG.md)** - All debugging tools and utilities
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Quick Fixes

#### Subscription Not Updating After Payment

```bash
# Quick fix for your user
npm run quick-fix

# Or check webhook configuration
curl https://your-domain.vercel.app/api/test-webhook
```

#### Find Your User ID

```bash
npm run find-user-id
```

### Debug Endpoints

- **Test Webhook**: `GET /api/test-webhook`
- **Debug Subscriptions**: `POST /api/debug-webhook`
- **Checkout Test**: `POST /api/stripe/create-checkout-session`

## 📝 API Endpoints

### Stripe Endpoints

- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhook events

### Debug Endpoints

- `GET /api/test-webhook` - Test webhook configuration
- `POST /api/debug-webhook` - List all subscriptions

For complete API documentation, see [API Documentation](docs/API.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Issues](https://github.com/lunabear27/skybox/issues) page
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Appwrite](https://appwrite.io/) for the backend-as-a-service
- [Stripe](https://stripe.com/) for payment processing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vercel](https://vercel.com/) for deployment

---

**Made with ❤️ by the SkyBox Team**
