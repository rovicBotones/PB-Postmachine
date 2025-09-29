#!/usr/bin/env node

/**
 * Script to get a never-expiring Facebook page access token
 *
 * Prerequisites:
 * 1. Get a short-lived user access token from Graph API Explorer
 * 2. Make sure you have pages_show_list, pages_manage_posts, pages_read_engagement permissions
 * 3. Update the constants below with your app credentials
 */

const APP_ID = '1871345696940282';
const APP_SECRET = 'd55a5af911a48441814ad4cec2f7e840';
const PAGE_ID = '123281457540260'; // People's Balita page ID

ageToken(shortLivedUserToken) {
  try {
    console.log('🔄 Step 1: Exchanging short-lived user token for long-lived user token...');

    // Step 1: Exchange short-lived user token for long-lived user token (60 days)
    const longLivedTokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedUserToken}`;

    const longLivedResponse = await fetch(longLivedTokenUrl);
    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      throw new Error(`Error getting long-lived token: ${longLivedData.error.message}`);
    }

    console.log('✅ Long-lived user token obtained');
    console.log('📅 This token is valid for 60 days');

    const longLivedUserToken = longLivedData.access_token;

    console.log('\n🔄 Step 2: Getting never-expiring page access token...');

    // Step 2: Get page access tokens (these never expire for pages you admin)
    const pageTokenUrl = `https://graph.facebook.com/v23.0/me/accounts?access_token=${longLivedUserToken}`;

    const pageResponse = await fetch(pageTokenUrl);
    const pageData = await pageResponse.json();

    if (pageData.error) {
      throw new Error(`Error getting page tokens: ${pageData.error.message}`);
    }

    // Find the specific page
    const targetPage = pageData.data.find(page => page.id === PAGE_ID);

    if (!targetPage) {
      console.log('\n❌ Page not found. Available pages:');
      pageData.data.forEach(page => {
        console.log(`   - ${page.name} (ID: ${page.id})`);
      });
      throw new Error(`Page with ID ${PAGE_ID} not found`);
    }

    console.log(`✅ Never-expiring page token obtained for: ${targetPage.name}`);
    console.log('🔑 Page Access Token (NEVER EXPIRES):');
    console.log(`${targetPage.access_token}\n`);

    // Verify the token
    console.log('🔄 Step 3: Verifying token...');
    const debugUrl = `https://graph.facebook.com/v23.0/debug_token?input_token=${targetPage.access_token}&access_token=${targetPage.access_token}`;

    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();

    if (debugData.data.expires_at === 0) {
      console.log('✅ SUCCESS: Token never expires!');
    } else {
      const expiryDate = new Date(debugData.data.expires_at * 1000);
      console.log(`⚠️  Token expires: ${expiryDate.toLocaleString()}`);
    }

    console.log('\n📝 Instructions:');
    console.log('1. Copy the page access token above');
    console.log('2. Update your .env file:');
    console.log(`   VITE_LONG_LIVED_ACCESS_TOKEN=${targetPage.access_token}`);
    console.log('3. Restart your development server');

    return targetPage.access_token;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Facebook Never-Expiring Page Token Generator\n');

  // Check if user provided a token as command line argument
  const userToken = process.argv[2];

  if (!userToken) {
    console.log('❌ Please provide a short-lived user access token as an argument\n');
    console.log('📖 Instructions:');
    console.log('1. Go to: https://developers.facebook.com/tools/explorer/');
    console.log('2. Select your app and generate a user access token');
    console.log('3. Make sure to include these permissions:');
    console.log('   - pages_show_list');
    console.log('   - pages_manage_posts');
    console.log('   - pages_read_engagement');
    console.log('4. Run this script: node get-page-token.js YOUR_USER_TOKEN');
    console.log('\nExample:');
    console.log('node get-page-token.js EAAalZBp...');
    process.exit(1);
  }

  await getNeverExpiringPageToken(userToken);
}

main();