#!/usr/bin/env node

/**
 * Facebook Token Monitor & Auto-Refresh
 *
 * This script monitors your Facebook token and can automatically refresh it
 * when it's about to expire or has already expired.
 *
 * Features:
 * - Checks current token status
 * - Detects expiration
 * - Automatically refreshes if you provide backup credentials
 * - Updates .env file automatically
 * - Can run as a scheduled task
 *
 * Usage:
 * node token-monitor.js [check|refresh|monitor]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ID = '1871345696940282';
const APP_SECRET = 'd55a5af911a48441814ad4cec2f7e840';
const PAGE_ID = '123281457540260';

// Helper to read .env
function readEnvToken() {
  const envPath = path.join(__dirname, '..', '.env');

  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_LONG_LIVED_ACCESS_TOKEN=(.*)/);
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

// Helper to update .env
function updateEnvToken(newToken) {
  const envPath = path.join(__dirname, '..', '.env');

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    const tokenRegex = /VITE_LONG_LIVED_ACCESS_TOKEN=.*/;
    const newTokenLine = `VITE_LONG_LIVED_ACCESS_TOKEN=${newToken}`;

    if (tokenRegex.test(envContent)) {
      envContent = envContent.replace(tokenRegex, newTokenLine);
    } else {
      envContent += `\n${newTokenLine}`;
    }

    fs.writeFileSync(envPath, envContent);
    return true;
  } catch (error) {
    console.error('❌ Error updating .env:', error.message);
    return false;
  }
}

// Check token status
async function checkTokenStatus() {
  const currentToken = readEnvToken();

  if (!currentToken) {
    return {
      status: 'missing',
      message: 'No token found in .env file',
      token: null
    };
  }

  try {
    const debugUrl = `https://graph.facebook.com/v23.0/debug_token?input_token=${currentToken}&access_token=${currentToken}`;
    const response = await fetch(debugUrl);
    const data = await response.json();

    if (data.error) {
      return {
        status: 'invalid',
        message: `Token error: ${data.error.message}`,
        token: currentToken
      };
    }

    const tokenInfo = data.data;

    if (!tokenInfo.is_valid) {
      return {
        status: 'expired',
        message: 'Token is no longer valid',
        token: currentToken
      };
    }

    if (tokenInfo.expires_at === 0) {
      return {
        status: 'valid',
        message: 'Token is valid and never expires',
        token: currentToken,
        expires_at: 0
      };
    } else {
      const expiryDate = new Date(tokenInfo.expires_at * 1000);
      const now = new Date();
      const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);

      if (hoursUntilExpiry < 0) {
        return {
          status: 'expired',
          message: `Token expired on ${expiryDate.toLocaleString()}`,
          token: currentToken,
          expires_at: tokenInfo.expires_at
        };
      } else if (hoursUntilExpiry < 24) {
        return {
          status: 'expiring_soon',
          message: `Token expires in ${Math.round(hoursUntilExpiry)} hours (${expiryDate.toLocaleString()})`,
          token: currentToken,
          expires_at: tokenInfo.expires_at
        };
      } else {
        return {
          status: 'valid',
          message: `Token expires on ${expiryDate.toLocaleString()}`,
          token: currentToken,
          expires_at: tokenInfo.expires_at
        };
      }
    }

  } catch (error) {
    return {
      status: 'error',
      message: `Error checking token: ${error.message}`,
      token: currentToken
    };
  }
}

// Quick refresh with stored backup token
async function quickRefresh() {
  // Try to read backup token from a secure file (not in repo)
  const backupTokenPath = path.join(process.env.USERPROFILE || process.env.HOME, '.facebook_backup_token');

  let backupToken = null;
  try {
    backupToken = fs.readFileSync(backupTokenPath, 'utf8').trim();
  } catch (error) {
    console.log('⚠️  No backup token found. Manual refresh required.');
    return false;
  }

  console.log('🔄 Attempting quick refresh with backup token...');

  try {
    // Exchange for long-lived token
    const longLivedUrl = `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${backupToken}`;

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      console.error('❌ Backup token failed:', longLivedData.error.message);
      return false;
    }

    // Get page token
    const pageUrl = `https://graph.facebook.com/v23.0/me/accounts?access_token=${longLivedData.access_token}`;
    const pageResponse = await fetch(pageUrl);
    const pageData = await pageResponse.json();

    if (pageData.error) {
      console.error('❌ Page token failed:', pageData.error.message);
      return false;
    }

    const targetPage = pageData.data.find(page => page.id === PAGE_ID);
    if (!targetPage) {
      console.error('❌ Target page not found');
      return false;
    }

    // Update .env
    if (updateEnvToken(targetPage.access_token)) {
      console.log('✅ Token refreshed successfully!');
      console.log('🔄 Please restart your development server');
      return true;
    } else {
      return false;
    }

  } catch (error) {
    console.error('❌ Quick refresh failed:', error.message);
    return false;
  }
}

// Main commands
async function runCommand(command) {
  switch (command) {
    case 'check':
      const status = await checkTokenStatus();
      console.log(`📊 Token Status: ${status.status.toUpperCase()}`);
      console.log(`📝 ${status.message}`);

      if (status.status === 'valid' && status.expires_at !== 0) {
        console.log('💡 Tip: Consider generating a never-expiring page token');
      }
      break;

    case 'refresh':
      console.log('🔄 Starting token refresh...');
      const currentStatus = await checkTokenStatus();

      if (currentStatus.status === 'valid' && currentStatus.expires_at === 0) {
        console.log('✅ Token is already valid and never expires. No refresh needed.');
        break;
      }

      const refreshed = await quickRefresh();
      if (!refreshed) {
        console.log('\n📋 Manual refresh required:');
        console.log('1. Go to: https://developers.facebook.com/tools/explorer/');
        console.log('2. Generate a new user token with required permissions');
        console.log('3. Run: node auto-refresh-token.js YOUR_NEW_TOKEN');
      }
      break;

    case 'monitor':
      console.log('👁️  Starting token monitor (checking every hour)...');
      console.log('Press Ctrl+C to stop');

      setInterval(async () => {
        const monitorStatus = await checkTokenStatus();
        const timestamp = new Date().toLocaleString();

        console.log(`[${timestamp}] Status: ${monitorStatus.status} - ${monitorStatus.message}`);

        if (monitorStatus.status === 'expired' || monitorStatus.status === 'expiring_soon') {
          console.log('🚨 Token needs refresh! Attempting automatic refresh...');
          await quickRefresh();
        }
      }, 60 * 60 * 1000); // Every hour
      break;

    case 'setup-backup':
      const readline = (await import('readline')).createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('🔑 Enter a long-lived user token to use as backup: ', (token) => {
        const backupPath = path.join(process.env.USERPROFILE || process.env.HOME, '.facebook_backup_token');

        try {
          fs.writeFileSync(backupPath, token.trim());
          console.log('✅ Backup token saved securely');
          console.log('💡 Now you can use "node token-monitor.js refresh" for automatic refresh');
        } catch (error) {
          console.error('❌ Failed to save backup token:', error.message);
        }

        readline.close();
      });
      break;

    default:
      console.log('🤖 Facebook Token Monitor\n');
      console.log('Commands:');
      console.log('  check           - Check current token status');
      console.log('  refresh         - Attempt to refresh expired token');
      console.log('  monitor         - Monitor token and auto-refresh');
      console.log('  setup-backup    - Setup backup token for auto-refresh');
      console.log('\nExamples:');
      console.log('  node token-monitor.js check');
      console.log('  node token-monitor.js refresh');
      console.log('  node token-monitor.js monitor');
  }
}

// Main execution
const command = process.argv[2] || 'help';
runCommand(command);