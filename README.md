<div align="center">
  <br />
  <p>
    <a href="https://www.npmjs.com/package/safestats"><img src="https://img.shields.io/npm/v/safestats.svg" alt="NPM Version" /></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" /></a>
  </p>
  <br />
  <h1 align="center">SafeStats</h1>
  <p align="center">
    <b>Analytics with Respect.</b>
    <br />
    Gather meaningful insights from your JavaScript projects without ever compromising user privacy.
  </p>
</div>

---

Ever felt stuck between needing to understand your users and the responsibility to protect their privacy? You want to fix bugs and improve your software, but traditional analytics tools feel intrusive, heavy, and legally complex.

> **We believe you shouldn't have to choose.** SafeStats is built on a simple philosophy: empower developers with the insights they need, while providing users with the safety they deserve.

This is a lightweight, zero-dependency, and isomorphic library that works seamlessly in both **Node.js** and the **Browser**.

## The Pillars of SafeStats

We designed SafeStats around four core principles to create a tool you can trust and love.

| Pillar                    | Description                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🛡️ **Privacy by Design**     | We don't just anonymize data; we make it impossible to collect PII. User identifiers are cryptographically hashed, and we automatically respect `DO_NOT_TRACK` signals. |
| 🌐 **Truly Universal**      | Use one library for your entire stack. SafeStats runs natively in both Node.js and modern browsers, providing a unified analytics experience.               |
| ⏱️ **Effortless Performance** | Go beyond usage stats. With our simple `startTimer` and `endTimer` API, you can easily measure the performance of critical code paths.               |
| 🧠 **Intelligent Context**  | Every event is automatically and safely enriched with environment context (like OS or Node version), helping you debug issues with zero extra configuration. |



## Getting Started in 60 Seconds

It's incredibly easy to integrate SafeStats into your project.

**1. Installation**

```bash
npm install safestats
```

**2. Initialize & Track**

```javascript
import { init, trackEvent, startTimer, endTimer } from 'safestats';

// --- 1. Initialize once when your app starts ---
// Configure the secure endpoint where your data will be sent.
init({
  endpointUrl: 'https://your-analytics-api.com/collect'
});

// --- 2. Track a custom event ---
// The user context (IP or a session ID) is required and will be anonymized.
const userContext = { ipAddress: '192.168.1.1' };

trackEvent(
  'project_created',
  userContext,
  { projectType: 'react-app' }
);

// --- 3. Measure code performance ---
// The same context can be used to link performance to an anonymous session.
startTimer('file_upload');
await uploadFile(file);
endTimer('file_upload', userContext); // Automatically sends a performance event!
```

## Transparency by Design: The Data We Send

We believe in full transparency. Here is an example of the clean, privacy-safe JSON payload that SafeStats sends to your endpoint. Notice that the original IP address is gone, replaced by an irreversible anonymous ID.

```json
{
  "eventName": "project_created",
  "anonymizedContext": {
    "anonymousId": "c7a8f9b2d3e4..." // SHA-256 hash of the user's IP + salt
  },
  "payload": {
    "projectType": "react-app"
  },
  "environment": {
    "platform": "darwin",     // 'win32' in Windows, 'linux', etc.
    "nodeVersion": "v18.17.0",
    "arch": "arm64"
  }
}
```

## Use as a GitHub Action

SafeStats can be used directly in your CI/CD workflows to track events like successful deployments, test failures, or build completions.

```yaml
# .github/workflows/deploy.yml
name: Deploy and Track

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      # ... your deployment steps here ...

      - name: Track Successful Deployment with SafeStats
        uses: Imran-Ashiq/safestats@v1 
        with:
          endpoint-url: ${{ secrets.ANALYTICS_ENDPOINT }}
          event-name: 'deployment_success'
          context: '{"sessionId": "${{ github.run_id }}"}' # Anonymize the unique workflow run ID
          payload: '{"commit": "${{ github.sha }}"}'
```

## Join the Mission

SafeStats is built for the community, by the community. We believe in building a more trustworthy and privacy-conscious web. If you share this vision, we would be honored to have your help. Please feel free to open an issue or submit a pull request.

## License

This project is proudly licensed under the **MIT License**.
