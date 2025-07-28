# OpsQuery - Production Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas**: Set up a production MongoDB cluster
4. **Environment Variables**: Prepare production environment variables

### Step 1: Prepare Your Environment

1. **Copy environment template**:
   ```bash
   cp .env.production.example .env.production
   ```

2. **Update production environment variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate a secure secret (minimum 32 characters)
   - `MANAGEMENT_JWT_SECRET`: Another secure secret for management auth
   - `NEXT_PUBLIC_APP_URL`: Your Vercel app URL (e.g., https://opsquery.vercel.app)

### Step 2: Deploy to Vercel

#### Option A: Through Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add each variable from `.env.production.example`
3. Set the environment to "Production"

**Critical Environment Variables**:
```
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=opsquery_production
JWT_SECRET=your-super-secure-secret-here
MANAGEMENT_JWT_SECRET=your-management-secret-here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Step 4: Domain Configuration

1. **Custom Domain** (Optional):
   - Go to project Settings → Domains
   - Add your custom domain
   - Update `NEXT_PUBLIC_APP_URL` to match your domain

2. **SSL Certificate**: Automatically handled by Vercel

### Step 5: Database Setup

1. **MongoDB Atlas Production Setup**:
   ```bash
   # Create production database
   # Set up proper user permissions
   # Configure IP whitelist (0.0.0.0/0 for Vercel)
   # Enable MongoDB connection pooling
   ```

2. **Seed Production Data** (if needed):
   ```bash
   # Access your Vercel function URL
   GET https://your-app.vercel.app/api/seed-production
   ```

### Step 6: Post-Deployment Verification

#### Test Critical Features:
- [ ] User authentication (login/logout)
- [ ] Dashboard loading (Operations, Sales, Credit, Management)
- [ ] Query creation and management
- [ ] Real-time messaging
- [ ] Excel/CSV exports
- [ ] Branch assignments
- [ ] Management approvals

#### Performance Checks:
- [ ] Page load speeds (<3 seconds)
- [ ] API response times (<1 second)
- [ ] Database connection stability
- [ ] Memory usage optimization

#### Security Validation:
- [ ] HTTPS enforcement
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] JWT token validation
- [ ] API rate limiting
- [ ] Input sanitization

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures
```bash
# Clear cache and rebuild
vercel --prod --force
```

#### 2. Environment Variable Issues
- Ensure all required variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Restart deployment after adding variables

#### 3. Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format
- Ensure database user has proper permissions

#### 4. Performance Issues
- Enable caching headers (already configured in vercel.json)
- Optimize database queries
- Use MongoDB connection pooling

#### 5. API Route Timeouts
- API routes have 30-second timeout (configured in vercel.json)
- Optimize long-running operations
- Consider background processing for heavy tasks

## 📊 Monitoring & Maintenance

### 1. Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor page performance and user engagement

### 2. Error Tracking
- Set up Sentry for error monitoring
- Configure alerts for critical errors

### 3. Database Monitoring
- Use MongoDB Atlas monitoring
- Set up alerts for connection issues
- Monitor query performance

### 4. Regular Maintenance
- **Weekly**: Check error logs and performance metrics
- **Monthly**: Review and update dependencies
- **Quarterly**: Security audit and penetration testing

## 🔄 CI/CD Pipeline

### Automatic Deployments
- **Production**: Deploys automatically from `main` branch
- **Preview**: Deploys from pull requests
- **Development**: Use `vercel dev` for local development

### Git Workflow
```bash
# Development
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature

# Create PR → Vercel preview deployment
# Merge to main → Production deployment
```

## 🚨 Emergency Procedures

### 1. Rollback Deployment
```bash
# Via Vercel CLI
vercel rollback

# Via Dashboard
# Go to project → Deployments → Click "Promote to Production" on previous deployment
```

### 2. Database Issues
- Have MongoDB Atlas backup strategy
- Maintain staging environment for testing
- Keep emergency contact information ready

### 3. Critical Bug Fixes
- Use hotfix branches for urgent fixes
- Test in preview environment first
- Deploy during low-traffic hours

## 📞 Support Contacts

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **MongoDB Support**: [mongodb.com/support](https://www.mongodb.com/support)
- **Project Repository**: [GitHub Issues](https://github.com/your-repo/issues)

---

## 🎉 Success Checklist

Before going live:
- [ ] All environment variables configured
- [ ] Database properly set up and secured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All tests passing
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Team access permissions configured
- [ ] Documentation updated

**Your OpsQuery application is now ready for production! 🚀** 