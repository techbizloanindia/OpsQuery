#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Run this script to validate your environment configuration
 * Usage: node scripts/validate-env.js
 */

const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

// Required environment variables
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
];

// Optional but recommended variables
const recommendedVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BASE_URL',
  'MONGODB_DATABASE',
  'NODE_ENV'
];

// Security checks
const securityChecks = [
  {
    name: 'JWT_SECRET length',
    check: () => {
      const secret = process.env.JWT_SECRET;
      return secret && secret.length >= 32;
    },
    message: 'JWT_SECRET should be at least 32 characters long'
  },
  {
    name: 'Admin password strength',
    check: () => {
      const password = process.env.ADMIN_PASSWORD;
      return password && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    },
    message: 'ADMIN_PASSWORD should be at least 8 characters with uppercase letter and number'
  },
  {
    name: 'Production environment security',
    check: () => {
      if (process.env.NODE_ENV === 'production') {
        return process.env.JWT_SECRET !== 'your-super-secret-jwt-key-change-this-in-production' &&
               process.env.ADMIN_PASSWORD !== 'Bizloan@2025';
      }
      return true;
    },
    message: 'Default secrets should be changed in production'
  }
];

// Load environment files
function loadEnvFiles() {
  const envFiles = ['.env', '.env.local'];
  let loadedFiles = [];
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      require('dotenv').config({ path: filePath });
      loadedFiles.push(file);
    }
  });
  
  return loadedFiles;
}

// Validate required variables
function validateRequired() {
  log.header('🔍 Checking Required Variables');
  let allValid = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log.success(`${varName} is configured`);
    } else {
      log.error(`${varName} is missing`);
      allValid = false;
    }
  });
  
  return allValid;
}

// Check recommended variables
function checkRecommended() {
  log.header('💡 Checking Recommended Variables');
  
  recommendedVars.forEach(varName => {
    if (process.env[varName]) {
      log.success(`${varName} is configured`);
    } else {
      log.warning(`${varName} is not set (using default)`);
    }
  });
}

// Run security checks
function runSecurityChecks() {
  log.header('🔒 Running Security Checks');
  let allSecure = true;
  
  securityChecks.forEach(check => {
    if (check.check()) {
      log.success(check.name);
    } else {
      log.warning(`${check.name}: ${check.message}`);
      allSecure = false;
    }
  });
  
  return allSecure;
}

// Check database connection
async function checkDatabase() {
  log.header('💾 Testing Database Connection');
  
  try {
    // This is a basic check - in a real scenario you might want to actually connect
    if (process.env.MONGODB_URI) {
      if (process.env.MONGODB_URI.includes('localhost')) {
        log.info('Using local MongoDB instance');
      } else if (process.env.MONGODB_URI.includes('mongodb.net')) {
        log.info('Using MongoDB Atlas');
      } else {
        log.info('Using custom MongoDB instance');
      }
      log.success('Database URI is configured');
    } else {
      log.error('Database URI is not configured');
      return false;
    }
  } catch (error) {
    log.error(`Database connection test failed: ${error.message}`);
    return false;
  }
  
  return true;
}

// Display environment summary
function displaySummary() {
  log.header('📊 Environment Summary');
  
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
  console.log(`Database: ${process.env.MONGODB_DATABASE || 'querymodel'}`);
  console.log(`Debug Mode: ${process.env.ENABLE_DEBUG_MODE || 'false'}`);
  console.log(`Refresh Interval: ${process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '5000'}ms`);
}

// Main validation function
async function main() {
  console.log(`${colors.bold}${colors.blue}🔧 OpsQuery Environment Validation${colors.reset}\n`);
  
  // Try to load dotenv if available
  try {
    require('dotenv');
  } catch (e) {
    log.warning('dotenv not installed - loading from system environment only');
  }
  
  // Load environment files
  const loadedFiles = loadEnvFiles();
  if (loadedFiles.length > 0) {
    log.info(`Loaded environment from: ${loadedFiles.join(', ')}`);
  }
  
  // Run all checks
  const requiredValid = validateRequired();
  checkRecommended();
  const securityValid = runSecurityChecks();
  const dbValid = await checkDatabase();
  displaySummary();
  
  // Final result
  log.header('🎯 Validation Result');
  
  if (requiredValid && dbValid) {
    log.success('Environment validation passed!');
    if (!securityValid && process.env.NODE_ENV === 'production') {
      log.warning('Some security recommendations should be addressed for production');
    }
    process.exit(0);
  } else {
    log.error('Environment validation failed - please fix the issues above');
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Validation script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
