/**
 * This file is the entrypoint for the action
 */
import { run } from './main';

// Call the actual logic of the action when this file is run directly
if (require.main === module) {
  run();
}

// Re-export for testing
export { run } from './main';
