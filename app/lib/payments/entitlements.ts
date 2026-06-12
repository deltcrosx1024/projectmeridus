// lib/payments/entitlements.ts
// Premium entitlement records stored in Upstash Redis
// Manages subscription state per Discord user (linked via payment metadata)

import { redis } from '../redis';

export type PlanTier = 'basic' | 'pro' | 'enterprise';

export interface PremiumEntitlement {
  discordUserId: string;
  premium: boolean;
  planTier: PlanTier;
  planName: string;
  expiresAt: string | null;       // ISO date string, null = lifetime
  provider: 'stripe' | 'opn';
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  canceledAt: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
}

export interface CheckEntitlementResult {
  hasPremium: boolean;
  planTier: PlanTier | null;
  planName: string | null;
  status: PremiumEntitlement['status'];
  expiresAt: string | null;
}

const ENTITLEMENT_PREFIX = 'premium:entitlement:';

function getEntitlementKey(discordUserId: string): string {
  return `${ENTITLEMENT_PREFIX}${discordUserId}`;
}

const DEFAULT_ENTITLEMENT: PremiumEntitlement = {
  discordUserId: '',
  premium: false,
  planTier: 'basic',
  planName: '',
  expiresAt: null,
  provider: 'stripe',
  providerSubscriptionId: null,
  providerCustomerId: null,
  transactionId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  canceledAt: null,
  status: 'canceled',
};

/**
 * Create or upsert a premium entitlement record in Redis.
 * Called from the payment webhook handler after a successful charge.
 */
export async function setEntitlement(data: PremiumEntitlement): Promise<void> {
  const key = getEntitlementKey(data.discordUserId);
  const record: PremiumEntitlement = {
    ...DEFAULT_ENTITLEMENT,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await redis.set(key, JSON.stringify(record));
}

/**
 * Fetch the active entitlement for a Discord user from Redis.
 * Returns null if the user has no entitlement record.
 */
export async function getEntitlement(
  discordUserId: string
): Promise<PremiumEntitlement | null> {
  const key = getEntitlementKey(discordUserId);
  const raw = await redis.get<string>(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PremiumEntitlement;
  } catch {
    console.error('[Entitlement] JSON parse failed', { key, raw });
    return null;
  }
}

/**
 * Return a lightweight premium-access check result for a Discord user.
 * Null = no record found (non-premium).
 */
export async function checkPremium(
  discordUserId: string
): Promise<CheckEntitlementResult | null> {
  const ent = await getEntitlement(discordUserId);
  if (!ent) return null;

  const now = Date.now();
  const isExpired =
    ent.expiresAt && new Date(ent.expiresAt).getTime() < now;

  const isEffectivelyActive =
    ent.premium &&
    ent.status === 'active' &&
    !isExpired;

  return {
    hasPremium: isEffectivelyActive,
    planTier: isEffectivelyActive ? ent.planTier : null,
    planName: isEffectivelyActive ? ent.planName : null,
    status: ent.status,
    expiresAt: ent.expiresAt,
  };
}

/**
 * Revoke premium access for a user. Called when a subscription is canceled,
 * payment disputes, or admin action.
 */
export async function revokeEntitlement(
  discordUserId: string,
  reason: string = 'manual'
): Promise<PremiumEntitlement | null> {
  const current = await getEntitlement(discordUserId);
  if (!current) return null;

  const updated: PremiumEntitlement = {
    ...current,
    premium: false,
    status: 'canceled',
    canceledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setEntitlement(updated);
  console.log('[Entitlement] Revoked', { discordUserId, reason });
  return updated;
}

/**
 * Return premium-gated embed content and ephemeral flag for a command response.
 * Use: if the user is blocked, reply with this embed instead of running the command.
 */
export function buildPremiumRequiredEmbed(
  checked: CheckEntitlementResult,
  commandName: string
) {
  return {
    content:
      `🔒 This command requires a **${checked.planName || 'premium'}** subscription.\n` +
      `Use \`/premium buy\` to upgrade.`,
    ephemeral: true,
  };
}
