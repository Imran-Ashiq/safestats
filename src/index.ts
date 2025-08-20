// src/index.ts
import { performance } from 'perf_hooks';

// --- Timer Store ---
// A Map to hold the start times of active timers.
const activeTimers = new Map<string, number>();
// -------------------
// --- NEW FUNCTIONS ---

/**
 * Starts a performance timer.
 * @param name A unique name for the timer.
 */
export const startTimer = (name: string) => {
  // performance.now() gives high-resolution time in milliseconds
  activeTimers.set(name, performance.now());
};

/**
 * Ends a performance timer and sends a 'performance_measurement' event.
 * If the timer was not started, this function does nothing.
 * @param name The name of the timer to end.
 * @param context A user context object, similar to trackEvent, to associate the
 *                performance metric with an anonymous user.
 */
// Note: now an 'async' function that returns a Promise<void>
export const endTimer = async (name: string, context: UserContext): Promise<void> => {
  const startTime = activeTimers.get(name);

  if (startTime) {
    const endTime = performance.now();
    const durationMs = endTime - startTime;
    activeTimers.delete(name);

    // MUST now 'await' the result of the async trackEvent function
    await trackEvent(
      'performance_measurement',
      context,
      {
        timerName: name,
        durationMs: durationMs,
      }
    );
  }
};

// --- Configuration Store ---
// We will store the library's configuration in this object.
interface AnalyticsConfig {
  endpointUrl?: string; // The URL to send data to
  salt: string;          // The salt for hashing. Can be overridden.
  enabled: boolean;      // A master switch to enable/disable tracking.
}

// Default configuration
let config: AnalyticsConfig = {
  salt: 'privacy-first-analytics-salt',
  enabled: false, // Disabled by default until 'init' is called.
};
// ----------------------------

/**
 * Initializes the analytics library. This must be called once
 * before any events can be tracked.
 * @param options The configuration options for the library.
 */
export const init = (options: {
  endpointUrl: string;
  salt?: string;
  enabled?: boolean;
}) => {
  config = {
    ...config,
    ...options,
    enabled: options.enabled ?? true, // Default to true if initialized
  };

  if (!config.endpointUrl) {
    console.warn('[SafeStats] Warning: `endpointUrl` is not set. Analytics will be disabled.');
    config.enabled = false;
  }
};


/**
 * Anonymizes a piece of data using a SHA-256 hash.
 * This function is isomorphic and works in both Node.js and browsers.
 * @param data The string to be anonymized.
 * @returns A promise that resolves to a SHA-256 hashed string.
 */
const anonymizeData = async (data: string): Promise<string> => {
  const saltedData = data + config.salt;

  // Check if we are in a browser environment
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(saltedData);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Convert array of bytes to a hex string
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } 
  // Otherwise, assume we are in a Node.js environment
  else {
    // Use a dynamic import to load the 'crypto' module only when needed.
    // This prevents browser bundlers from crashing.
    const { createHash } = await import('crypto');
    return createHash('sha256').update(saltedData).digest('hex');
  }
};

// --- Interfaces (no changes here) ---
interface EventPayload {
  [key: string]: any;
}
interface UserContext {
  sessionId?: string;
  ipAddress?: string;
}
// ------------------------------------

/**
 * The main function to track an anonymous event.
 * Sends the anonymized data to the configured endpoint via a POST request.
 * @param eventName The name of the event being tracked.
 * @param context An object containing potentially sensitive user data that will be anonymized.
 * @param payload An optional object containing non-identifiable data about the event.
 */
export const trackEvent = async ( // Note: Now an async function
  eventName: string,
  context: UserContext,
  payload?: EventPayload
): Promise<void> => {

  // NEW: 1. Respect the standard "Do Not Track" environment variable.
  // This is a crucial privacy feature that overrides all other settings.
  if (process.env.DO_NOT_TRACK === '1') {
    return;
  }

  // 2. Check if the library has been initialized and enabled. (Was #1 before)
  if (!config.enabled || !config.endpointUrl) {
    return;
  }


  // 3. Anonymize context
  const anonymizedContext: { [key: string]: string } = {};
  if (context.sessionId) {
    // MUST now 'await' the result of the async function
    anonymizedContext.anonymousId = await anonymizeData(context.sessionId);
  } else if (context.ipAddress) {
    // MUST now 'await' the result of the async function
    anonymizedContext.anonymousId = await anonymizeData(context.ipAddress);
  }

  // NEW: 4. Automatically gather safe environment context.
  const environment = {
    platform: process.platform,
    nodeVersion: process.version,
    arch: process.arch,
  };

  // 5. Prepare the final data object to be sent
  const finalPayload = {
    eventName,
    anonymizedContext,
    payload: payload || {},
    environment, // Add the new environment object here
  };

  // 4. Dispatch the data using fetch
  try {
    // 'fetch' is globally available in recent Node.js versions (v18+)
    await fetch(config.endpointUrl, {
      method: 'POST',
      body: JSON.stringify(finalPayload),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Suppress fetch errors to prevent crashing the host application.
    // A real library might have a debug mode to log these.
    // console.error('[Analytics] Error sending event:', error);
  }
};