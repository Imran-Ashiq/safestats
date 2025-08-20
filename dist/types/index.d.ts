/**
 * Starts a performance timer.
 * @param name A unique name for the timer.
 */
export declare const startTimer: (name: string) => void;
/**
 * Ends a performance timer and sends a 'performance_measurement' event.
 * If the timer was not started, this function does nothing.
 * @param name The name of the timer to end.
 * @param context A user context object, similar to trackEvent, to associate the
 *                performance metric with an anonymous user.
 */
export declare const endTimer: (name: string, context: UserContext) => Promise<void>;
/**
 * Initializes the analytics library. This must be called once
 * before any events can be tracked.
 * @param options The configuration options for the library.
 */
export declare const init: (options: {
    endpointUrl: string;
    salt?: string;
    enabled?: boolean;
}) => void;
interface EventPayload {
    [key: string]: any;
}
interface UserContext {
    sessionId?: string;
    ipAddress?: string;
}
/**
 * The main function to track an anonymous event.
 * Sends the anonymized data to the configured endpoint via a POST request.
 * @param eventName The name of the event being tracked.
 * @param context An object containing potentially sensitive user data that will be anonymized.
 * @param payload An optional object containing non-identifiable data about the event.
 */
export declare const trackEvent: (// Note: Now an async function
eventName: string, context: UserContext, payload?: EventPayload) => Promise<void>;
export {};
