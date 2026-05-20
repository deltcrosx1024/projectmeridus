// api/webhooks/services/braintree/route.ts
// Braintree (PayPal) Payment & Subscription Webhook Handler
//
// Registers this URL in the Braintree Control Panel:
//   Settings → Webhooks → Production URL: https://your-domain.com/api/webhooks/services/braintree
//
// Braintree POSTs a `bt_signature` and `bt_payload` form field.
// The `bt_payload` value is a serialised WebhookNotification; we parse it
// with the SDK to get a strongly-typed object.
//
// Env vars required:
//   BRAINTREE_PRIVATE_KEY, BRAINTREE_PUBLIC_KEY, BRAINTREE_MERCHANT_ID
//   BRAINTREE_ENVIRONMENT (sandbox | production)
//   BRAINTREE_WEBHOOK_SECRET  (the webhook signing secret from the Braintree Control Panel)

import { NextResponse } from 'next/server';
// The braintree SDK (v3.x, CJS) ships bundled JS without .d.ts declarations.
// We use `esModuleInterop` (tsconfig) and accept the SDK as `any` here,
// narrowing the shape at call sites rather than polluting the whole file.
import braintree from 'braintree';
import { redis } from '@/app/lib/redis';
import { setEntitlement, revokeEntitlement } from '@/app/lib/payments/entitlements';

// ---------------------------------------------------------------------------
// Braintree SDK surface we rely on (kept in one place for easy audit)
// ---------------------------------------------------------------------------
interface BraintreeGateway {
  config: {
    environment:  'sandbox' | 'production';
    merchantId:   string;
    publicKey:    string;
    privateKey:   string;
  };
  webhookNotification: {
    parse(signature: string, payload: string): WebhookNotification;
  };
  webhookTesting: {
    sampleNotification(kind: string): { signature: string; payload: string };
  };
}

interface WebhookNotification {
  kind: string;
  timestamp: string;
  subscription: SubscriptionRecord | null;
  subscriptionTransaction: TransactionRecord | null;
  transaction: TransactionRecord | null;
  dispute: DisputeRecord | null;
}

interface SubscriptionRecord {
  id:                string | null;
  planId:            string | null;
  status:            string;
  billingCyclesCompleted: number | null;
  createdAt:         string | null;
  customerId:        string;
  metadata?:         Record<string, string>;
}

interface TransactionRecord {
  id:      string;
  amount:  string;
  type:    string;
}

interface DisputeRecord {
  id:             string;
  status:         string;
  reason:         string;
  transactionId:  string;
  amount:         string;
  subscriptionId: string | null;
  customFields?:  Record<string, string>;
}

// ---------------------------------------------------------------------------
// Runtime gateway factory (singleton)
// ---------------------------------------------------------------------------

let _gateway: BraintreeGateway | null = null;

/** Cast the default braintree export to the interface shape we verified at runtime.  */
const bt = braintree as unknown as BraintreeGateway;

function getGateway(): BraintreeGateway {
  if (_gateway) return _gateway;

  const privateKey  = process.env.BRAINTREE_PRIVATE_KEY;
  const publicKey   = process.env.BRAINTREE_PUBLIC_KEY;
  const merchantId  = process.env.BRAINTREE_MERCHANT_ID;
  const isProd      = (process.env.BRAINTREE_ENVIRONMENT ?? 'sandbox') === 'production';

  if (!privateKey || !publicKey || !merchantId) {
    throw new Error(
      '[Braintree] Missing Braintree credentials: set BRAINTREE_PRIVATE_KEY, BRAINTREE_PUBLIC_KEY and BRAINTREE_MERCHANT_ID'
    );
  }

  // The Braintree SDK exports BraintreeGateway as a class — use `new`, not `.create()`
  const BraintreeGatewayCtor = (bt as any).BraintreeGateway ?? bt;
  _gateway = new BraintreeGatewayCtor({
    environment:  isProd ? 'production' : 'sandbox',
    merchantId,
    publicKey,
    privateKey,
  });

  if (!_gateway?.webhookNotification) {
    throw new Error('[Braintree] webhookNotification namespace is unavailable on this gateway');
  }

  return _gateway;
}

// ---------------------------------------------------------------------------
// Redis helpers
// ---------------------------------------------------------------------------

const WEBHOOK_HANDLED_PREFIX = 'braintree:webhook:';
const ENTITLEMENT_PREFIX     = 'premium:entitlement:';

function handledRecordKey(kind: string, timestamp: string): string {
  return `${WEBHOOK_HANDLED_PREFIX}${kind}:${timestamp}`;
}

// ---------------------------------------------------------------------------
// Discord user extraction
// ---------------------------------------------------------------------------

async function getDiscordUserIdFromSub(
  sub: SubscriptionRecord
): Promise<string | null> {
  return sub.metadata?.discord_user_id ?? null;
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

async function alreadyHandled(kind: string, timestamp: string): Promise<boolean> {
  return (await redis.exists(handledRecordKey(kind, timestamp))) === 1;
}

async function markHandled(kind: string, timestamp: string): Promise<void> {
  await redis.setex(handledRecordKey(kind, timestamp), 60 * 60 * 24 * 30, '1');
}

// ─── Plan / status mapping ─────────────────────────────────────────────────

type PlanTier        = 'basic' | 'pro' | 'enterprise';
type PremiumStatus   = 'active' | 'trialing' | 'past_due' | 'canceled';

function planTierOf(planId: string | null | undefined): PlanTier {
  const p = (planId ?? '').toLowerCase();
  if (p.includes('enterprise')) return 'enterprise';
  if (p.includes('pro'))        return 'pro';
  return 'basic';
}

function planNameOf(planId: string | null | undefined): string {
  return planId ?? 'unknown';
}

function subStatusToInternal(s: string | undefined): PremiumStatus {
  switch (s) {
    case 'Active':   return 'active';
    case 'Pending':  return 'trialing';
    case 'Past Due': return 'past_due';
    default:         return 'canceled';
  }
}

/** Derive an ISO expiry date from Braintree subscription billing cycle state. */
function computeExpiry(sub: SubscriptionRecord): string | null {
  const cycles = sub.billingCyclesCompleted ?? null;
  if (cycles === null) return null;
  const expiryMs = Date.now() + Math.max(1, cycles) * 30 * 24 * 60 * 60 * 1000;
  return new Date(expiryMs).toISOString();
}

// ─── Discord DM helper ─────────────────────────────────────────────────────

const botToken = process.env.DISCORD_BOT_TOKEN;

async function sendDiscordDM(discordUserId: string, content: string): Promise<void> {
  if (!botToken) return;
  try {
    const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method:  'POST',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: discordUserId }),
    });
    if (!dmRes.ok) return;
    const { id: channelId } = await dmRes.json();
    if (!channelId) return;
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method:  'POST',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch {
    /* best-effort only */
  }
}

// ─── Environment checks ────────────────────────────────────────────────────

function envOk(): NextResponse | null {
  if (!process.env.BRAINTREE_WEBHOOK_SECRET ||
      process.env.BRAINTREE_WEBHOOK_SECRET === 'webhook_secret_here') {
    console.warn(
      '[Braintree] BRAINTREE_WEBHOOK_SECRET not set or is a placeholder – ' +
      'set the real secret in the Braintree Control Panel and update .env'
    );
  }
  return null;
}

// ─── GET health-check ──────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status:  'ok',
    service: 'braintree-webhook',
    env:     process.env.BRAINTREE_ENVIRONMENT ?? 'sandbox',
  });
}

// ─── POST handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const missingEnv = envOk();
  if (missingEnv) return missingEnv;

  let rawPayload: string;
  try {
    rawPayload = await request.text();
  } catch {
    return NextResponse.json({ error: 'Unable to read request body' }, { status: 400 });
  }

  if (!rawPayload?.trim()) {
    return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
  }

  // Braintree posts x-www-form-urlencoded
  const params = new URLSearchParams(rawPayload);
  const signaturePayload = params.get('bt_signature');   // "kind|<base64sig>"
  const rawBtPayload     = params.get('bt_payload');      // base64 blob

  if (!signaturePayload || !rawBtPayload) {
    console.error('[Braintree] Missing bt_signature or bt_payload');
    return NextResponse.json(
      { error: 'Missing bt_signature or bt_payload' },
      { status: 400 }
    );
  }

  const signaturePart = signaturePayload.split('|')[1]!;

  // ── Parse + verify signature (throws on bad / expired signature) ────────
  const gateway = getGateway();

  let notification: WebhookNotification;
  try {
    const raw = gateway.webhookNotification.parse(signaturePart, rawBtPayload);
    notification = raw as unknown as WebhookNotification;
  } catch (err: any) {
    console.error('[Braintree] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const { kind, timestamp } = notification;

  // ── Idempotency: Braintree may re-deliver up to 3 times ─────────────────
  if (await alreadyHandled(kind, timestamp)) {
    console.log('[Braintree] Duplicate delivery – already handled', { kind, timestamp });
    return NextResponse.json({ status: 'duplicate' }, { status: 200 });
  }

  console.log('[Braintree] Webhook received', { kind, timestamp });

  // ── Route to sub-handler (always ack so Braintree won't infinite-retry) ─
  try {
    switch (kind) {
      // ── Subscription billing ────────────────────────────────────────────
      case 'subscription_charged_successfully':
        await onChargedSuccessfully(notification);
        break;

      case 'subscription_charged_unsuccessfully':
        await onChargedUnsuccessfully(notification);
        break;

      case 'subscription_trial_ended':
      case 'subscription_went_active':
        await onSubscriptionActive(notification);
        break;

      case 'subscription_went_past_due':
        await onPastDue(notification);
        break;

      case 'subscription_canceled':
      case 'subscription_expired':
        await onSubscriptionEnded(notification);
        break;

      case 'subscription_billing_skipped':
        console.log('[Braintree] Billing skipped', { sub: notification.subscription?.id });
        break;

      // ── Transactions ────────────────────────────────────────────────────
      case 'transaction_settled':
      case 'transaction_disbursed':
        const tx = notification.transaction;
        console.log('[Braintree] Transaction event', {
          kind,
          id:     tx?.id,
          amount: tx?.amount,
          type:   tx?.type,
        });
        break;

      // ── Disputes ────────────────────────────────────────────────────────
      case 'dispute_opened':
        await onDisputeOpened(notification);
        break;

      case 'dispute_won':
        await onDisputeWon(notification);
        break;

      case 'dispute_lost':
      case 'dispute_accepted':
      case 'dispute_auto_accepted':
        await onDisputeResolved(notification, kind);
        break;

      default:
        console.log('[Braintree] Unhandled webhook kind:', kind);
    }
  } catch (handlerErr: any) {
    // Assert we have handled even if our own code throws, so Braintree
    // stops retrying (otherwise it will re-deliver with exponential backoff).
    console.error(`[Braintree] Handler error (kind=${kind}):`, handlerErr);
  } finally {
    await markHandled(kind, timestamp);
  }

  return NextResponse.json({ received: true, kind }, { status: 200 });
}

// ===========================================================================
// Sub-handlers
// Each receives the fully-typed WebhookNotification so `subscription` and
// `dispute` are directly accessible via the type-safe shape verified above.
// ===========================================================================

async function onChargedSuccessfully(n: WebhookNotification): Promise<void> {
  const sub = n.subscription!;
  const discordUserId = await getDiscordUserIdFromSub(sub);
  if (!discordUserId) {
    console.warn('[Braintree] No discord_user_id in subscription metadata', { subId: sub.id });
    return;
  }

  await setEntitlement({
    discordUserId,
    premium:               true,
    planTier:              planTierOf(sub.planId),
    planName:              planNameOf(sub.planId),
    expiresAt:             computeExpiry(sub),
    provider:              'braintree',
    providerSubscriptionId: sub.id,
    providerCustomerId:     sub.customerId,
    transactionId:          n.subscriptionTransaction?.id ?? null,
    createdAt:              sub.createdAt ?? new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    canceledAt:             null,
    status:                 'active',
  });

  console.log('[Braintree] Entitlement set (charge success)', {
    discordUserId,
    planId:  sub.planId,
    txnId:   n.subscriptionTransaction?.id,
    amount:  n.subscriptionTransaction?.amount,
  });
}

async function onChargedUnsuccessfully(n: WebhookNotification): Promise<void> {
  const sub = n.subscription!;
  const discordUserId = await getDiscordUserIdFromSub(sub);
  if (!discordUserId) return;

  await setEntitlement({
    discordUserId,
    premium:               false,
    planTier:              planTierOf(sub.planId),
    planName:              planNameOf(sub.planId),
    expiresAt:             null,
    provider:              'braintree',
    providerSubscriptionId: sub.id,
    providerCustomerId:     sub.customerId,
    transactionId:          n.subscriptionTransaction?.id ?? null,
    createdAt:              sub.createdAt ?? new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    canceledAt:             null,
    status:                 'past_due',
  });

  console.warn('[Braintree] Charge failed – premium suspended', {
    discordUserId,
    subId: sub.id,
    reason: n.subscriptionTransaction?.type ?? 'unknown',
  });
}

async function onSubscriptionActive(n: WebhookNotification): Promise<void> {
  const sub = n.subscription!;
  const discordUserId = await getDiscordUserIdFromSub(sub);
  if (!discordUserId) return;

  const status: PremiumStatus = subStatusToInternal(sub.status);

  await setEntitlement({
    discordUserId,
    premium:               status === 'active',
    planTier:              planTierOf(sub.planId),
    planName:              planNameOf(sub.planId),
    expiresAt:             computeExpiry(sub),
    provider:              'braintree',
    providerSubscriptionId: sub.id,
    providerCustomerId:     sub.customerId,
    transactionId:          null,
    createdAt:              sub.createdAt ?? new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    canceledAt:             null,
    status,
  });

  console.log('[Braintree] Subscription became active/trial', {
    discordUserId,
    subId:  sub.id,
    status,
  });
}

async function onPastDue(n: WebhookNotification): Promise<void> {
  const sub = n.subscription!;
  const discordUserId = await getDiscordUserIdFromSub(sub);
  if (!discordUserId) return;

  await setEntitlement({
    discordUserId,
    premium:               false,
    planTier:              planTierOf(sub.planId),
    planName:              planNameOf(sub.planId),
    expiresAt:             null,
    provider:              'braintree',
    providerSubscriptionId: sub.id,
    providerCustomerId:     sub.customerId,
    transactionId:          null,
    createdAt:              sub.createdAt ?? new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    canceledAt:             null,
    status:                 'past_due',
  });

  console.warn('[Braintree] Subscription past due', { discordUserId, subId: sub.id });
}

async function onSubscriptionEnded(n: WebhookNotification): Promise<void> {
  const sub = n.subscription!;
  const discordUserId = await getDiscordUserIdFromSub(sub);
  if (!discordUserId) return;

  await revokeEntitlement(discordUserId, n.kind);

  await sendDiscordDM(discordUserId,
    `⚠️ Your subscription has ended (${n.kind}). Premium features are no longer available. ` +
    `Use \`/premium buy\` to renew.`
  ).catch(() => {});
}

async function onDisputeOpened(n: WebhookNotification): Promise<void> {
  const discordUserId = n.dispute?.customFields?.discord_user_id ?? null;
  if (!discordUserId) return;

  console.warn('[Braintree] Dispute opened', {
    discordUserId,
    disputeId: n.dispute?.id,
  });

  // Suspend premium access while the dispute is investigated
  await setEntitlement({
    discordUserId,
    premium:               false,
    planTier:              'basic',
    planName:              'suspended_dispute',
    expiresAt:             null,
    provider:              'braintree',
    providerSubscriptionId: n.dispute?.subscriptionId ?? null,
    providerCustomerId:     null,
    transactionId:          n.dispute?.transactionId ?? null,
    createdAt:              new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    canceledAt:             null,
    status:                 'canceled',
  });

  await sendDiscordDM(discordUserId,
    '⚠️ A payment dispute was opened for your account. ' +
    'Premium access has been temporarily suspended. ' +
    'It will be restored once the dispute is resolved.'
  ).catch(() => {});
}

async function onDisputeResolved(n: WebhookNotification, kind: string): Promise<void> {
  const discordUserId = n.dispute?.customFields?.discord_user_id ?? null;
  if (!discordUserId) return;

  const isLost = kind === 'dispute_lost' || kind === 'dispute_accepted' || kind === 'dispute_auto_accepted';

  if (isLost) {
    await revokeEntitlement(discordUserId, kind);
    await sendDiscordDM(discordUserId,
      '❌ Your payment dispute was not resolved in your favour. ' +
      'Premium access has been removed. Please contact support if you believe this is an error.'
    ).catch(() => {});
  }
}

async function onDisputeWon(n: WebhookNotification): Promise<void> {
  const discordUserId = n.dispute?.customFields?.discord_user_id ?? null;
  if (!discordUserId) return;

  console.log('[Braintree] Dispute won', {
    discordUserId,
    disputeId: n.dispute?.id,
  });

  await sendDiscordDM(discordUserId,
    '✅ Your payment dispute was resolved in your favour. Premium access has been restored.'
  ).catch(() => {});
}
