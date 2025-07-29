#!/usr/bin/env node

/**
 * Production Environment Variables Checker
 * Run this script to verify all required environment variables are set for production
 */

const chalk = require('chalk'); // eslint-disable-line

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'MONGODB_DATABASE',
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'JWT_SECRET'
];

const OPTIONAL_ENV_VARS = [
  'MONGODB_USERS_COLLECTION',
  'MONGODB_BRANCHES_COLLECTION',
  'MONGODB_CHAT_COLLECTION',
  'MONGODB_APPLICATIONS_COLLECTION',
  'MONGODB_MANAGEMENT_COLLECTION',
  'MANAGEMENT_JWT_SECRET'
];

console.log(chalk.blue('🔍 Checking Production Environment Variables...\n'));

const missingRequired = [];
const missingOptional = [];

// Check required variables
REQUIRED_ENV_VARS.forEach(varName => {
  if (!process.env[varName]) {
    missingRequired.push(varName);
    console.log(chalk.red(`❌ ${varName} - MISSING (REQUIRED)`));
  } else {
    // Don't log the actual value for security
    const displayValue = varName.includes('SECRET') || varName.includes('URI') 
      ? '[HIDDEN]' 
      : process.env[varName];
    console.log(chalk.green(`✅ ${varName} - ${displayValue}`));
  }
});

// Check optional variables
OPTIONAL_ENV_VARS.forEach(varName => {
  if (!process.env[varName]) {
    missingOptional.push(varName);
    console.log(chalk.yellow(`⚠️  ${varName} - MISSING (OPTIONAL)`));
  } else {
    const displayValue = varName.includes('SECRET') || varName.includes('URI') 
      ? '[HIDDEN]' 
      : process.env[varName];
    console.log(chalk.green(`✅ ${varName} - ${displayValue}`));
  }
});

console.log('\n' + chalk.blue('📋 Summary:'));

if (missingRequired.length > 0) {
  console.log(chalk.red(`❌ ${missingRequired.length} REQUIRED variables missing:`));
  missingRequired.forEach(varName => {
    console.log(chalk.red(`   - ${varName}`));
  });
  console.log(chalk.red('\n🚨 Your application will NOT work in production without these variables!'));
  
  console.log(chalk.blue('\n🔧 To fix this:'));
  console.log(chalk.white('1. If using Vercel:'));
  console.log(chalk.white('   - Go to your project dashboard → Settings → Environment Variables'));
  console.log(chalk.white('   - Add each missing variable with its value'));
  console.log(chalk.white('   - Redeploy your application'));
  
  console.log(chalk.white('\n2. If using other platforms:'));
  console.log(chalk.white('   - Configure environment variables in your deployment platform'));
  console.log(chalk.white('   - Ensure NODE_ENV=production is set'));
  
  process.exit(1);
} else {
  console.log(chalk.green(`✅ All ${REQUIRED_ENV_VARS.length} required variables are set!`));
}

if (missingOptional.length > 0) {
  console.log(chalk.yellow(`⚠️  ${missingOptional.length} optional variables missing (using defaults)`));
}

console.log(chalk.green('\n🎉 Environment configuration looks good for production!'));
