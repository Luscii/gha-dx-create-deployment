import * as core from '@actions/core';
import { DxApiClient } from './api-client';
import { DeploymentConfig, DeploymentPayload, DeploymentResponse } from './types';

/**
 * Service for creating deployments in DX platform
 */
export class DeploymentService {
  private readonly apiClient: DxApiClient;

  constructor(config: DeploymentConfig) {
    this.apiClient = new DxApiClient(config.dxHost, config.bearer);
  }

  /**
   * Create a deployment with the given configuration
   */
  async createDeployment(config: DeploymentConfig): Promise<DeploymentResponse> {
    // Log deployment information
    core.info(`Creating deployment for service: ${config.service}`);
    core.info(`Repository: ${config.repository}`);
    core.info(`Commit SHA: ${config.commitSha}`);
    core.info(`Deployed at: ${config.deployedAt}`);

    // Prepare the payload
    const payload: DeploymentPayload = {
      repository: config.repository,
      service: config.service,
      commit_sha: config.commitSha,
      deployed_at: config.deployedAt,
    };

    // Make the API call
    const response = await this.apiClient.createDeployment(payload);

    core.info('Deployment created successfully');
    return response;
  }

  /**
   * Set GitHub Actions outputs based on the API response
   */
  setActionOutputs(response: DeploymentResponse): void {
    core.setOutput('response', JSON.stringify(response));
    core.setOutput('deployment_id', response.id || 'unknown');
  }
}