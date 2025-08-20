/**
 * A simple representation of the data we expect for an event.
 */
interface EventPayload {
    [key: string]: any;
}
/**
 * The main function to track an anonymous event.
 * For now, it just logs the event to the console.
 *
 * @param eventName The name of the event being tracked.
 * @param payload An object containing non-identifiable data about the event.
 */
export declare const trackEvent: (eventName: string, payload?: EventPayload) => void;
export {};
