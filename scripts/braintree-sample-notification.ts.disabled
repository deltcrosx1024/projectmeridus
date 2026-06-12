// DELETE THIS FILE AFTER USE
// Generates a braintree sample notification to confirm the SDK/keys work
// and to inspect the exact raw payload and signature that your endpoint will receive.

import braintree from 'braintree';

const privateKey  = process.env.BRAINTREE_PRIVATE_KEY as string;
const publicKey   = process.env.BRAINTREE_PUBLIC_KEY as string;
const merchantId  = process.env.BRAINTREE_MERCHANT_ID as string;
const isProd      = (process.env.BRAINTREE_ENVIRONMENT || 'sandbox') === 'production';

try {
  const gw = new (braintree as any).BraintreeGateway({
    environment:  isProd ? 'production' : 'sandbox',
    merchantId,
    publicKey,
    privateKey,
  });

  const { signature, payload } = gw.webhookTesting.sampleNotification('subscription_charged_successfully');

  console.log('=== Braintree Sample Test Notification ===');
  console.log('bt_signature:', signature);
  console.log('bt_payload:  ', payload);
  console.log();
  console.log('Raw HTTP body to POST to your endpoint:');
  console.log(`bt_signature=${encodeURIComponent(signature)}&bt_payload=${encodeURIComponent(payload)}`);
  console.log();

  const parsed: any = (gw as any).webhookNotification.parse(signature, payload);
  console.log('Parsed kind:', parsed.kind);
  console.log('Parsed subscription id:', parsed.subscription?.id);
  console.log('Parsed subscription status:', parsed.subscription?.status);
} catch (e: any) {
  console.error('Error:', e.message);
}
