// DELETE AFTER USE
// Generates a sample Braintree test notification payload + signature.
// Confirms the SDK is correctly configured against your Sandbox/Production keys.
//
// Usage: node scripts\braintree-test-webhook.js
//
// Copy the printed `bt_signature` and `bt_payload` into a curl POST to:
//   GET https://meridusdev.in.th/api/webhooks/services/braintree
//   POST https://meridusdev.in.th/api/webhooks/services/braintree

// Load .env manually without installing dotenv
const fs   = require('fs');
const path = require('path');
const envFile = path.join(__dirname, '..', '.env');
fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)/m);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
});

const { BraintreeGateway } = require('braintree');

const privateKey = process.env.BRAINTREE_PRIVATE_KEY;
const publicKey  = process.env.BRAINTREE_PUBLIC_KEY;
const merchantId = process.env.BRAINTREE_MERCHANT_ID;
const isProd     = process.env.BRAINTREE_ENVIRONMENT === 'production';

if (!privateKey || !publicKey || !merchantId) {
  console.error('Missing Braintree credentials in .env. Aborting.');
  process.exit(1);
}

(async () => {
  // BraintreeGateway is the constructor itself — use `new`, not `.create()`.
  const gw = new BraintreeGateway({
    environment:  isProd ? 'production' : 'sandbox',
    merchantId,
    publicKey,
    privateKey,
  });

  // Generate a sample subscription-charged event
  const { signature, payload } = gw.webhookTesting.sampleNotification('subscription_charged_successfully');

  console.log('=== Braintree Sample Webhook Notification ===');
  console.log();
  console.log('bt_signature:');
  console.log(signature);
  console.log();
  console.log('bt_payload:');
  console.log(payload);
  console.log();

  // Ready-to-run curl snippet
  const postData = [
    'bt_signature=' + encodeURIComponent(signature),
    'bt_payload='   + encodeURIComponent(payload),
  ].join('&');
  console.log('─── curl test ──────────────────────────────────');
  console.log(
    `curl -X POST https://meridusdev.in.th/api/webhooks/services/braintree \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d '<POST BODY>'`
  );
  console.log('─── Copy this as the POST body ─────────────────');
  console.log(postData);
  console.log('───────────────────────────────────────────────');

  // Confirm the SDK can parse it back (throws on bad sig)
  try {
    const n = gw.webhookNotification.parse(signature, payload);
    const s = n.subscription;
    console.log('\n● SDK parse OK');
    console.log('  kind:        ', n.kind);
    console.log('  sub id:      ', s && s.id);
    console.log('  sub status:  ', s && s.status);
    console.log('  sub planId:  ', s && s.planId);
    console.log('  customerId:  ', s && s.customerId);
    console.log('  txn id:      ', n.subscriptionTransaction && n.subscriptionTransaction.id);
    console.log('  txn amount:  ', n.subscriptionTransaction && n.subscriptionTransaction.amount);
    console.log('\n→ POSTing these exact values to your endpoint should return 200.');
  } catch (e) {
    console.log('\n✗ SDK parse FAILED:', e.message);
    console.log('  The Braintree sample notification could not be verified.');
    console.log('  Double-check your .env keys (publicKey must match the panel).');
  }
})();
