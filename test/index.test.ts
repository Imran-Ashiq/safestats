/**
 * @jest-environment jsdom
 */

// --- Mocking Browser APIs ---
// Mock the SubtleCrypto API for the jsdom environment
const mockDigest = jest.fn(async (algorithm, data) => {
  // A simple mock implementation. A real one would do actual hashing.
  // We'll just return a fixed ArrayBuffer.
  return new ArrayBuffer(8); 
});

Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
});

// jsdom doesn't include TextEncoder, so we need to provide it from Node's utils
global.TextEncoder = require('util').TextEncoder;
// ----------------------------
// test/index.test.ts

// Import BOTH functions now
import { init, trackEvent, startTimer, endTimer } from '../src/index';
import { performance } from 'perf_hooks';

// Mock the performance.now() function
jest.mock('perf_hooks', () => ({
  // Keep the original module, but overwrite `performance`
  ...jest.requireActual('perf_hooks'),
  performance: {
    ...jest.requireActual('perf_hooks').performance,
    now: jest.fn(), // Mock the `now` function specifically
  },
}));
const mockPerformanceNow = performance.now as jest.Mock;
// --- NEW TEST SUITE ---
describe('Performance Timers', () => {
  it('should not send an event if endTimer is called without startTimer', () => {
    // Call endTimer for a timer that was never started
    endTimer('non_existent_timer', { ipAddress: '1.1.1.1' });

    // Expect that fetch was NOT called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should calculate duration and send a performance_measurement event', async () => {
    const timerName = 'database_query';
    const mockContext = { sessionId: 'session-123' };

    // Set up our mock time
    mockPerformanceNow.mockReturnValueOnce(1000); // Start time
    mockPerformanceNow.mockReturnValueOnce(1250); // End time

    // Run the functions
    startTimer(timerName);
    await endTimer(timerName, mockContext); // Await because endTimer calls trackEvent (which is async)

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const fetchOptions = mockFetch.mock.calls[0][1];
    const body = JSON.parse(fetchOptions.body);

    // Check the event details
    expect(body.eventName).toBe('performance_measurement');
    expect(body.payload.timerName).toBe(timerName);
    expect(body.payload.durationMs).toBe(250); // 1250 - 1000
    expect(body.anonymizedContext).toHaveProperty('anonymousId');
  });
});

// --- Mocking fetch ---
// We mock the global fetch function to intercept network calls.
const mockFetch = jest.fn();
global.fetch = mockFetch;
// ---------------------

// A mock endpoint URL for testing
const MOCK_ENDPOINT = 'https://api.example.com/analytics';

// Reset mocks and configuration before each test to ensure isolation
beforeEach(() => {
  mockFetch.mockClear();
  // "Reset" the library's state by initializing it with default test values
  init({ endpointUrl: MOCK_ENDPOINT, enabled: true });
});

describe('init', () => {
  it('should disable tracking if endpointUrl is missing', () => {
    // We need to spy on console.warn for this test
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // @ts-expect-error - We are intentionally passing an invalid config
    init({ endpointUrl: undefined });

    trackEvent('test_event', { ipAddress: '1.1.1.1' });

    // Expect that fetch was NOT called because the library is disabled
    expect(mockFetch).not.toHaveBeenCalled();
    // Expect that a warning was logged to the console
    expect(consoleSpy).toHaveBeenCalledWith(
   '[SafeStats] Warning: `endpointUrl` is not set. Analytics will be disabled.'
    );

    consoleSpy.mockRestore();
  });
});

describe('trackEvent', () => {

  // NEW TEST CASE
  it('should not send an event if the DO_NOT_TRACK environment variable is set to "1"', async () => {
    // Store the original value so we can restore it later
    const originalDNT = process.env.DO_NOT_TRACK;
    // Set the environment variable for this test
    process.env.DO_NOT_TRACK = '1';

    // Attempt to track an event
    await trackEvent('an_event', { ipAddress: '1.1.1.1' });

    // The core assertion: fetch should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled();

    // Clean up: Restore the original environment variable value
    process.env.DO_NOT_TRACK = originalDNT;
  });

  it('should send an event with anonymized data to the correct endpoint', async () => {
    const ipAddress = '192.168.1.1';
    const eventName = 'user_login';
    const payload = { plan: 'premium' };

    await trackEvent(eventName, { ipAddress }, payload);

    // 1. Check if fetch was called
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 2. Check the URL it was called with
    expect(mockFetch).toHaveBeenCalledWith(
      MOCK_ENDPOINT,
      expect.any(Object)
    );

    // 3. Check the content of the POST request
    const fetchOptions = mockFetch.mock.calls[0][1];
    const body = JSON.parse(fetchOptions.body);

    expect(fetchOptions.method).toBe('POST');
    expect(body.eventName).toBe(eventName);
    expect(body.payload).toEqual(payload);
  expect(body.anonymizedContext).toHaveProperty('anonymousId');
  // Ensure the original IP is not in the sent data
  expect(JSON.stringify(body)).not.toContain(ipAddress);

  // --- NEW ASSERTIONS ---
  // 4. Check that the environment context was added correctly.
  expect(body).toHaveProperty('environment');
  expect(body.environment.platform).toBe(process.platform);
  expect(body.environment.nodeVersion).toBe(process.version);
  expect(body.environment.arch).toBe(process.arch);
  // -----------------------
  });

  it('should handle fetch errors gracefully and not crash', async () => {
    // Make the mock fetch reject with an error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // We expect that calling trackEvent does NOT throw an error, even if fetch fails
    await expect(
      trackEvent('failing_event', { ipAddress: '1.1.1.1' })
    ).resolves.not.toThrow();
  });
});