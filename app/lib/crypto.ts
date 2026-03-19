// lib/crypto.ts
// AES-256-GCM encryption for sensitive tokens

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  console.error('[Crypto] WARNING: ENCRYPTION_KEY not set. Tokens will not be encrypted!');
}

// Convert string key to CryptoKey
async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a token using AES-256-GCM
 * Returns base64-encoded string: iv:ciphertext:authTag
 */
export async function encryptToken(plainText: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    throw new Error('ENCRYPTION_KEY not configured - tokens will not be encrypted');
  }

  try {
    const key = await getKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plainText)
    );
    
    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[Crypto] Encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt a token using AES-256-GCM
 * Expects base64-encoded string from encryptToken
 */
export async function decryptToken(cipherText: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Only allow plain: prefix in development for testing
    if (cipherText.startsWith('plain:')) {
      return atob(cipherText.replace('plain:', ''));
    }
    throw new Error('ENCRYPTION_KEY not configured');
  }

  if (cipherText.startsWith('plain:')) {
    throw new Error('Cannot decrypt plain-text token - ENCRYPTION_KEY was not set during encryption');
  }

  try {
    const key = await getKey();
    
    // Decode base64
    const combined = new Uint8Array(
      atob(cipherText).split('').map(c => c.charCodeAt(0))
    );
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('[Crypto] Decryption error:', error);
    throw new Error('Failed to decrypt token - may be corrupted or wrong key');
  }
}

/**
 * Hash a Discord user ID for Redis key lookup
 * Uses simple hashing to avoid storing raw IDs in keys
 */
export function hashUserId(discordUserId: string): string {
  // Simple hash for key naming
  let hash = 0;
  for (let i = 0; i < discordUserId.length; i++) {
    const char = discordUserId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `user:${Math.abs(hash).toString(16)}:${discordUserId.slice(-4)}`;
}
