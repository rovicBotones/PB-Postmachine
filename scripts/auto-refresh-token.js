#!/usr/bin/env node

/**
 * Automated Facebook Token Refresh Script
 *
 * This script attempts to automatically refresh Facebook access tokens.
 *
 * LIMITATIONS:
 * - Facebook requires manual authorization for security
 * - Cannot bypass Facebook's OAuth flow completely
 * - But can automate the exchange process once you provide initial token
 *
 * USAGE:
 * 1. Get initial user token from Graph API Explorer (one-time manual step)
 * 2. Run this script to automatically create never-expiring page token
 * 3. Script updates .env file automatically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from .env file
const APP_ID = '1871345696940282';
const APP_SECRET = 'd55a5af911a48441814ad4cec2f7e840';
const PAGE_ID = '123281457540260'; // People's Balita page ID

// Helper function to update .env file
function updateEnvFile(newToken) {
  const envPath = path.join(__dirname, '..', '.env');

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace the existing token
    const tokenRegex = /VITE_LONG_LIVED_ACCESS_TOKEN=.*/;
    const newTokenLine = `VITE_LONG_LIVED_ACCESS_TOKEN=${newToken}`;

    if (tokenRegex.test(envContent)) {
      envContent = envContent.replace(tokenRegex, newTokenLine);
    } else {
      envContent += `\n${newTokenLine}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated successfully!');
    console.log('🔄 Please restart your development server');

  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    console.log('📝 Please manually update your .env file with:');
    console.log(`VITE_LONG_LIVED_ACCESS_TOKEN=${newToken}`);
  }
}

// Main token refresh function
async function refreshAccessToken(userToken) {
  try {
    console.log('🚀 Starting automated token refresh...\n');

    // Step 1: Check if current token is still valid
    console.log('🔄 Step 1: Checking current token status...');

    // Read current token from .env
    const envPath = path.join(__dirname, '..', '.env');
    let currentToken = '';

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/VITE_LONG_LIVED_ACCESS_TOKEN=(.*)/);
      if (match) {
        currentToken = match[1].trim();
      }
    } catch (error) {
      console.log('⚠️  Could not read current token from .env');
    }

    if (currentToken) {
      console.log('🔍 Checking if current token is still valid...');

      try {
        const debugUrl = `https://graph.facebook.com/v23.0/debug_token?input_token=${currentToken}&access_token=${currentToken}`;
        const debugResponse = await fetch(debugUrl);
        const debugData = await debugResponse.json();

        if (debugData.data && debugData.data.is_valid) {
          if (debugData.data.expires_at === 0) {
            console.log('✅ Current token is valid and never expires!');
            console.log('ℹ️  No refresh needed.');
            return currentToken;
          } else {
            const expiryDate = new Date(debugData.data.expires_at * 1000);
            console.log(`⚠️  Current token expires: ${expiryDate.toLocaleString()}`);
          }
        } else {
          console.log('❌ Current token is invalid or expired');
        }
      } catch (error) {
        console.log('⚠️  Could not validate current token, proceeding with refresh...');
      }
    }

    // Step 2: Exchange user token for long-lived user token
    console.log('\n🔄 Step 2: Getting long-lived user token...');

    const longLivedTokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${userToken}`;

    const longLivedResponse = await fetch(longLivedTokenUrl);
    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      throw new Error(`Error getting long-lived user token: ${longLivedData.error.message}`);
    }

    console.log('✅ Long-lived user token obtained (valid for 60 days)');
    const longLivedUserToken = longLivedData.access_token;

    // Step 3: Get never-expiring page token
    console.log('\n🔄 Step 3: Getting never-expiring page token...');

    const pageTokenUrl = `https://graph.facebook.com/v23.0/me/accounts?access_token=${longLivedUserToken}`;
    const pageResponse = await fetch(pageTokenUrl);
    const pageData = await pageResponse.json();

    if (pageData.error) {
      throw new Error(`Error getting page tokens: ${pageData.error.message}`);
    }

    // Find target page
    const targetPage = pageData.data.find(page => page.id === PAGE_ID);

    if (!targetPage) {
      console.log('\n❌ Target page not found. Available pages:');
      pageData.data.forEach(page => {
        console.log(`   - ${page.name} (ID: ${page.id})`);
      });
      throw new Error(`Page with ID ${PAGE_ID} not found`);
    }

    // Step 4: Verify token never expires
    console.log('\n🔄 Step 4: Verifying token expiration...');

    const debugUrl = `https://graph.facebook.com/v23.0/debug_token?input_token=${targetPage.access_token}&access_token=${targetPage.access_token}`;
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();

    if (debugData.data.expires_at === 0) {
      console.log('✅ SUCCESS: Token never expires!');
    } else {
      const expiryDate = new Date(debugData.data.expires_at * 1000);
      console.log(`⚠️  Token expires: ${expiryDate.toLocaleString()}`);
    }

    // Step 5: Update .env file automatically
    console.log('\n🔄 Step 5: Updating .env file...');
    updateEnvFile(targetPage.access_token);

    console.log(`\n🎉 Token refresh completed successfully!`);
    console.log(`📄 Page: ${targetPage.name}`);
    console.log(`🔑 New Token: ${targetPage.access_token.substring(0, 20)}...`);

    return targetPage.access_token;

  } catch (error) {
    console.error('\n❌ Token refresh failed:', error.message);
    return null;
  }
}

// Interactive token collection
async function getInteractiveToken() {
  const readline = (await import('readline')).createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('🔗 Please follow these steps to get a user access token:');
    console.log('');
    console.log('1. Open: https://developers.facebook.com/tools/explorer/');
    console.log('2. Select your app: "PB-Postmachine"');
    console.log('3. Click "Generate Access Token"');
    console.log('4. Select permissions: pages_show_list, pages_manage_posts, pages_read_engagement');
    console.log('5. Copy the generated token');
    console.log('');

    readline.question('🔑 Paste your user access token here: ', (token) => {
      readline.close();
      resolve(token.trim());
    });
  });
}

// Main execution
async function main() {
  console.log('🤖 Automated Facebook Token Refresh Tool\n');

  // Check command line argument first
  let userToken = process.argv[2];

  // If no token provided, ask interactively
  if (!userToken) {
    userToken = await getInteractiveToken();
  }

  if (!userToken) {
    console.log('❌ No token provided. Exiting...');
    process.exit(1);
  }

  await refreshAccessToken(userToken);
}

main();