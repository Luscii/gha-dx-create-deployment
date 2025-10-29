import * as core from '@actions/core';
import { DxApiClient } from './api-client';
import { DeploymentConfig, DeploymentPayload, DxSuccessResponse } from './types';

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
  async createDeployment(config: DeploymentConfig): Promise<DxSuccessResponse> {
    // Log deployment information
    core.info(`Creating deployment for service: ${config.service}`);
    
    if (config.repository && config.commitSha) {
      core.info(`Repository: ${config.repository}`);
      core.info(`Commit SHA: ${config.commitSha}`);
    }
    
    if (config.mergeCommitShas && config.mergeCommitShas.length > 0) {
      core.info(`Merge commit SHAs: ${config.mergeCommitShas.join(', ')}`);
    }
    
    core.info(`Deployed at: ${config.deployedAt}`);
    core.info(`Environment: ${config.environment || 'production (default)'}`);
    core.info(`DX Instance: ${config.dxHost}`);

    // Log optional parameters
    if (config.referenceId) core.info(`Reference ID: ${config.referenceId}`);
    if (config.sourceUrl) core.info(`Source URL: ${config.sourceUrl}`);
    if (config.sourceName) core.info(`Source Name: ${config.sourceName}`);
    if (config.integrationBranch) core.info(`Integration Branch: ${config.integrationBranch}`);
    if (config.success !== undefined) core.info(`Success: ${config.success}`);
    if (config.metadata) core.info(`Metadata: ${JSON.stringify(config.metadata)}`);

    // Prepare the payload - only include defined values
    const payload: DeploymentPayload = {
      service: config.service,
      deployed_at: config.deployedAt,
    };

    // Add attribution mode fields
    if (config.mergeCommitShas && config.mergeCommitShas.length > 0) {
      payload.merge_commit_shas = config.mergeCommitShas;
    } else if (config.repository && config.commitSha) {
      payload.repository = config.repository;
      payload.commit_sha = config.commitSha;
    }

    // Add optional fields if provided
    if (config.referenceId) payload.reference_id = config.referenceId;
    if (config.sourceUrl) payload.source_url = config.sourceUrl;
    if (config.sourceName) payload.source_name = config.sourceName;
    if (config.metadata) payload.metadata = config.metadata;
    if (config.integrationBranch) payload.integration_branch = config.integrationBranch;
    if (config.success !== undefined) payload.success = config.success;
    if (config.environment) payload.environment = config.environment;

    // Make the API call
    const response = await this.apiClient.createDeployment(payload);

    core.info('Deployment created successfully');
    return response;
  }

  /**
   * Set GitHub Actions outputs based on the API response
   */
  setActionOutputs(response: DxSuccessResponse): void {
    core.setOutput('response', JSON.stringify(response));
    core.setOutput('deployment_id', (response as Record<string, unknown>).id as string || 'unknown');
  }
}