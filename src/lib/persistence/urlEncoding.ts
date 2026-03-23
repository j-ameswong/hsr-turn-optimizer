import type { TeamConfig } from '../engine/types';
import { defaultTeamConfig } from '../engine/types';

const HASH_PREFIX = 'config=';

/**
 * Encode a TeamConfig into a base64url string for use in the URL hash.
 * URL format: https://example.com/#config=<encoded>
 */
export function encodeConfig(config: TeamConfig): string {
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  // Convert to base64url
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a base64url string back into a TeamConfig.
 * Returns null if decoding fails.
 */
export function decodeConfig(encoded: string): TeamConfig | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as TeamConfig;
    if (!parsed.cycleMode || !Array.isArray(parsed.members)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Read config from the current URL hash.
 * Returns null if no config hash is present or it's invalid.
 */
export function readConfigFromHash(): TeamConfig | null {
  const hash = window.location.hash.slice(1); // remove leading #
  if (!hash.startsWith(HASH_PREFIX)) return null;
  return decodeConfig(hash.slice(HASH_PREFIX.length));
}

/**
 * Generate a shareable URL string for the given config.
 */
export function buildShareUrl(config: TeamConfig): string {
  const encoded = encodeConfig(config);
  const url = new URL(window.location.href);
  url.hash = `${HASH_PREFIX}${encoded}`;
  return url.toString();
}

/**
 * Load initial config: URL hash → localStorage → default.
 * Imported by useTeamConfig.
 */
export function loadInitialConfig(localStorageFallback: TeamConfig): TeamConfig {
  const fromHash = readConfigFromHash();
  if (fromHash) return fromHash;
  return localStorageFallback;
}

export { defaultTeamConfig };
