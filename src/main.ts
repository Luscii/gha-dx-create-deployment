import * as core from '@actions/core';
import { getActionInputs, createDeploymentConfig } from './inputs';
import { DeploymentService } from './deployment-service';

/**
 * Main function to execute the DX deployment creation
 * @returns {Promise<void>} Resolves when the action is complete
 */
export async function run(): Promise<void> {
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

// Export other utilities that might be needed for testing
export * from './types';
export * from './inputs';
export * from './api-client';
export * from './deployment-service';
