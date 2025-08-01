# 🤝 Contributing to SkyBox

Thank you for your interest in contributing to SkyBox! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Git
- Code editor (VS Code recommended)
- Accounts for Appwrite, Stripe, and Vercel (for testing)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/skybox.git
   cd skybox
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/lunabear27/skybox.git
   ```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file:

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

### 3. Setup Development Environment

```bash
# Setup Stripe configuration
npm run setup-stripe

# Setup environment variables
npm run setup-env

# Setup subscriptions collection
npm run setup-subscriptions
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your changes.

## 📝 Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type when possible
- Use strict TypeScript configuration

### React/Next.js

- Use functional components with hooks
- Follow Next.js 13+ App Router conventions
- Use server components when appropriate
- Implement proper error boundaries

### Styling

- Use Tailwind CSS for styling
- Follow utility-first approach
- Use DaisyUI components when available
- Maintain responsive design

### File Structure

```
components/
├── ui/           # Reusable UI components
├── forms/        # Form components
└── layout/       # Layout components

lib/
├── actions/      # Server actions
├── utils/        # Utility functions
└── types/        # TypeScript types

app/
├── api/          # API routes
├── dashboard/    # Dashboard pages
└── globals.css   # Global styles
```

## 🧪 Testing

### Manual Testing

Before submitting a PR, test:

1. **Authentication flow**
2. **File upload/download**
3. **Subscription management**
4. **Payment processing**
5. **Responsive design**

### Automated Testing

```bash
# Run linting
npm run lint

# Build project
npm run build

# Type checking
npx tsc --noEmit
```

### Testing Stripe Integration

1. **Use test card numbers**:

   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. **Test webhook processing**:
   ```bash
   curl https://your-domain.vercel.app/api/test-webhook
   curl -X POST https://your-domain.vercel.app/api/debug-webhook
   ```

## 🔄 Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Test your changes thoroughly

### 3. Update Documentation

- Update README.md if needed
- Add comments for complex code
- Update API documentation if applicable

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing

- [ ] Tested locally
- [ ] All tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

### 6. Review Process

- Address review comments promptly
- Make requested changes
- Ensure CI/CD checks pass
- Maintain clean commit history

## 🐛 Issue Reporting

### Before Creating an Issue

1. **Check existing issues** for duplicates
2. **Search documentation** for solutions
3. **Try troubleshooting steps** from [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

### Issue Template

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: [e.g., Windows, macOS, Linux]
- Browser: [e.g., Chrome, Firefox, Safari]
- Version: [e.g., 1.0.0]

## Additional Information

- Screenshots
- Console errors
- Network tab information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature

## Use Case

Why this feature is needed

## Proposed Solution

How you think it should work

## Alternatives Considered

Other approaches you considered

## Additional Information

- Mockups/screenshots
- Related issues
- Implementation suggestions
```

## 📚 Documentation

### Contributing to Documentation

- Keep documentation up to date
- Use clear, concise language
- Include code examples
- Add screenshots when helpful

### Documentation Files

- `README.md` - Main project documentation
- `docs/SETUP.md` - Setup instructions
- `docs/API.md` - API documentation
- `docs/TROUBLESHOOTING.md` - Troubleshooting guide
- `CONTRIBUTING.md` - This file

## 🏷️ Commit Message Convention

Use conventional commit messages:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 🔒 Security

### Security Guidelines

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate all user inputs
- Follow security best practices

### Reporting Security Issues

For security issues, please email directly instead of creating a public issue.

## 🎯 Areas for Contribution

### High Priority

- [ ] Bug fixes
- [ ] Security improvements
- [ ] Performance optimizations
- [ ] Documentation updates

### Medium Priority

- [ ] New features
- [ ] UI/UX improvements
- [ ] Testing coverage
- [ ] Code refactoring

### Low Priority

- [ ] Minor enhancements
- [ ] Code style improvements
- [ ] Additional examples

## 📞 Getting Help

### Resources

- [Main Documentation](../README.md)
- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

### Community

- GitHub Issues
- GitHub Discussions
- Pull Request reviews

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page

---

**Thank you for contributing to SkyBox!** 🚀

Your contributions help make SkyBox better for everyone.
