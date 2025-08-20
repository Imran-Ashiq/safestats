// action/index.js
const core = require('@actions/core');
const { init, trackEvent } = require('safestats');

async function run() {
  try {
    // 1. Get all the inputs from the workflow file
    const endpointUrl = core.getInput('endpoint-url', { required: true });
    const eventName = core.getInput('event-name', { required: true });
    const contextJson = core.getInput('context', { required: true });
    const payloadJson = core.getInput('payload');

    // 2. Safely parse the JSON inputs
    const context = JSON.parse(contextJson);
    const payload = JSON.parse(payloadJson);

    // 3. Initialize your SafeStats library
    init({ endpointUrl });

    // 4. Track the event using your library's functions!
    core.info(`Tracking SafeStats event: "${eventName}"...`);
    await trackEvent(eventName, context, payload);
    core.info('Event tracked successfully!');

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();