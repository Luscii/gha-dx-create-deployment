import * as core from '@actions/core';
import { getActionInputs, createDeploymentConfig } from './inputs';
import { DeploymentService } from './deployment-service';

/**
 * Main function to execute the DX deployment creation
 */
async function run(): Promise<void> {
  try {
    // Get and validate inputs
    const inputs = getActionInputs();
    const config = createDeploymentConfig(inputs);

    // Create deployment service and execute deployment
    const deploymentService = new DeploymentService(config);
    const response = await deploymentService.createDeployment(config);

    // Set GitHub Actions outputs
    deploymentService.setActionOutputs(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

// Run the action
if (require.main === module) {
  run();
}

export { run };
export * from './types';
export * from './inputs';
export * from './api-client';
export * from './deployment-service';