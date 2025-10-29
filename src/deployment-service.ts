import * as core from '@actions/core';
import { DxApiClient } from './api-client';
import { DeploymentConfig, DeploymentPayload, DxSuccessResponse } from './types';

/**
 * Service for creating deployments in DX platform
 */
export class DeploymentService {
  private readonly apiClient: DxApiClient;
  private readonly config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.apiClient = new DxApiClient(config.dxHost, config.bearer);
  }

  /**
   * Create a deployment with the given configuration
   */
  async createDeployment(): Promise<DxSuccessResponse> {
    // Log deployment information
    core.info(`Creating deployment for service: ${this.config.service}`);
    
    if (this.config.mergeCommitShas && this.config.mergeCommitShas.length > 0) {
      core.info(`Merge commit SHAs: ${this.config.mergeCommitShas.join(', ')}`);
    } else if (this.config.repository && this.config.commitSha) {
      core.info(`Repository: ${this.config.repository}`);
      core.info(`Commit SHA: ${this.config.commitSha}`);
    }
    
    core.info(`Deployed at: ${this.config.deployedAt}`);
    core.info(`Environment: ${this.config.environment || 'production (default)'}`);
    core.info(`DX Instance: ${this.config.dxHost}`);

    // Log optional parameters
    if (this.config.referenceId) core.info(`Reference ID: ${this.config.referenceId}`);
    if (this.config.sourceUrl) core.info(`Source URL: ${this.config.sourceUrl}`);
    if (this.config.sourceName) core.info(`Source Name: ${this.config.sourceName}`);
    if (this.config.integrationBranch) core.info(`Integration Branch: ${this.config.integrationBranch}`);
    if (this.config.success !== undefined) core.info(`Success: ${this.config.success}`);
    if (this.config.metadata) core.info(`Metadata: ${JSON.stringify(this.config.metadata)}`);

    // Prepare the payload - only include defined values
    const payload: DeploymentPayload = {
      service: this.config.service,
      deployed_at: this.config.deployedAt,
    };

    // Add attribution mode fields
    if (this.config.mergeCommitShas && this.config.mergeCommitShas.length > 0) {
      payload.merge_commit_shas = this.config.mergeCommitShas;
    } else if (this.config.repository && this.config.commitSha) {
      // Only add repository and commit_sha if they're not empty (merge commit mode sets them to empty strings)
      payload.repository = this.config.repository;
      payload.commit_sha = this.config.commitSha;
    }

    // Add optional fields if provided
    if (this.config.referenceId) payload.reference_id = this.config.referenceId;
    if (this.config.sourceUrl) payload.source_url = this.config.sourceUrl;
    if (this.config.sourceName) payload.source_name = this.config.sourceName;
    if (this.config.metadata) payload.metadata = this.config.metadata;
    if (this.config.integrationBranch) payload.integration_branch = this.config.integrationBranch;
    if (this.config.success !== undefined) payload.success = this.config.success;
    if (this.config.environment) payload.environment = this.config.environment;

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