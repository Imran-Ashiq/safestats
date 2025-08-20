"use strict";
// src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackEvent = void 0;
/**
 * The main function to track an anonymous event.
 * For now, it just logs the event to the console.
 *
 * @param eventName The name of the event being tracked.
 * @param payload An object containing non-identifiable data about the event.
 */
const trackEvent = (eventName, payload) => {
    console.log(`[Analytics] Event Tracked: "${eventName}"`, payload || {});
    // In the future, this is where the real logic for anonymization
    // and sending data will go.
};
exports.trackEvent = trackEvent;
