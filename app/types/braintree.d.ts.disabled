// types/braintree.d.ts
// Ambient declarations for the Braintree Node SDK (braintree v3.x).
// The package ships its own JS but the npm distribution does not carry .d.ts files,
// so we declare only the symbols we touch in our own code to avoid a blanket `any`.

declare module 'braintree' {
  namespace BraintreeGateway {
    enum Environment {
      Sandbox     = 'sandbox',
      Production  = 'production',
    }
  }

  interface BraintreeGatewayConfig {
    environment: BraintreeGateway.Environment;
    merchantId:  string;
    publicKey:   string;
    privateKey:  string;
  }

  // The static `.create` factory used by the SDK
  class BraintreeGateway {
    static create(config: BraintreeGatewayConfig): PromiseLike<BraintreeGateway>;
    config: BraintreeGatewayConfig;
    webhookNotification:       WebhookNotificationGateway;
    webhookTesting:            {  sampleNotification(kind: string): string };
  }

  // ── webhookNotification gateway ──────────────────────────────────────────
  interface WebhookNotificationGateway {
    /** Parse + cryptographically verify a Braintree webhook notification. */
    parse(signature: string, payload: string): WebhookNotification;
    /** Create a sample payload + signature for local webhook testing. */
    sampleNotification(kind: WebhookNotification['kind']): { signature: string; payload: string };
  }

  // ── Subscription shapes returned in webhook notifications ─────────────────
  interface BraintreeSubscription {
    id:                string | null;
    planId:            string | null;
    status:            string;
    billingCyclesCompleted: number | null;
    createdAt:         string | null;
    customerId:        string;
    metadata?:         Record<string, string>;
  }

  interface BraintreeTransaction {
    id:      string;
    amount:  string;
    type:    string;
  }

  // ── Dispute shape ────────────────────────────────────────────────────────
  interface BraintreeDispute {
    id:             string;
    status:         string;
    reason:         string;
    transactionId:  string;
    amount:         string;
    subscriptionId: string | null;
    customFields?:  Record<string, string>;
  }

  // ── WebhookNotification ──────────────────────────────────────────────────
  interface WebhookNotification {
    kind: WebhookNotificationKind;

    // Present only for the matching event kind; all are nullable so TS won't
    // complain when the wrong field is absent.
    subscription:              BraintreeSubscription | null;
    subscriptionTransaction:   BraintreeTransaction | null;
    transaction:               BraintreeTransaction | null;
    dispute:                   BraintreeDispute | null;

    timestamp: string;
  }

  // ── Kind union mirrors the SDK Kind enum ─────────────────────────────────
  type WebhookNotificationKind =
  // Subscription lifecycle
  | 'subscription_charged_successfully'
  | 'subscription_charged_unsuccessfully'
  | 'subscription_trial_ended'
  | 'subscription_went_active'
  | 'subscription_went_past_due'
  | 'subscription_canceled'
  | 'subscription_expired'
  | 'subscription_billing_skipped'
  // Transaction / disbursement
  | 'transaction_settled'
  | 'transaction_disbursed'
  // Disputes
  | 'dispute_opened'
  | 'dispute_won'
  | 'dispute_lost'
  | 'dispute_accepted'
  | 'dispute_auto_accepted'
  | 'dispute_disputed'
  | 'dispute_expired'
  | 'dispute_under_review'
  // Other payment events
  | 'refund_failed'
  | 'payment_method_revoked_by_customer'
  | 'oauth_access_revoked';

  // Re-export `Environment` so callers can also import from 'braintree' directly
  const Environment: BraintreeGateway.Environment;

  export {
    BraintreeGateway,
    BraintreeGatewayConfig,
    BraintreeSubscription,
    BraintreeTransaction,
    BraintreeDispute,
    WebhookNotification,
    WebhookNotificationGateway,
    WebhookNotificationKind,
  };
  export { Environment };
}
