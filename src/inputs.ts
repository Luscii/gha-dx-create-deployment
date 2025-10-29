import * as core from '@actions/core';
import { ActionInputs, DeploymentConfig } from './types';

/**
 * Get and validate action inputs
 */
export function getActionInputs(): ActionInputs {
  return {
    dx_instance: core.getInput('dx_instance', { required: true }),
    bearer: core.getInput('bearer', { required: true }),
    service: core.getInput('service', { required: true }),
    repository: core.getInput('repository'),
    commit_sha: core.getInput('commit_sha'),
    deployed_at: core.getInput('deployed_at'),
    reference_id: core.getInput('reference_id'),
    source_url: core.getInput('source_url'),
    source_name: core.getInput('source_name'),
    metadata: core.getInput('metadata'),
    integration_branch: core.getInput('integration_branch'),
    success: core.getInput('success'),
    environment: core.getInput('environment'),
    merge_commit_shas: core.getInput('merge_commit_shas'),
  };
}

/**
 * Validate required inputs and throw an error if any are missing
 */
export function validateRequiredInputs(inputs: ActionInputs): void {
  if (!inputs.dx_instance) {
    throw new Error('dx_instance input is required');
  }
  if (!inputs.bearer) {
    throw new Error('bearer input is required');
  }
  if (!inputs.service) {
    throw new Error('service input is required');
  }
}

/**
 * Parse JSON input safely
 */
function parseJsonInput(input: string | undefined, fieldName: string): Record<string, unknown> | undefined {
  if (!input || input.trim() === '') {
    return undefined;
  }
  
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error(`${fieldName} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid JSON in ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse JSON array input safely
 */
function parseJsonArrayInput(input: string | undefined, fieldName: string): string[] | undefined {
  if (!input || input.trim() === '') {
    return undefined;
  }
  
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be a JSON array`);
    }
    // Validate all elements are strings
    for (const item of parsed) {
      if (typeof item !== 'string') {
        throw new Error(`${fieldName} must contain only strings`);
      }
    }
    return parsed as string[];
  } catch (error) {
    throw new Error(`Invalid JSON array in ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse boolean input safely
 */
function parseBooleanInput(input: string | undefined): boolean | undefined {
  if (!input || input.trim() === '') {
    return undefined;
  }
  
  const normalized = input.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  
  throw new Error(`Boolean input must be "true" or "false", got: ${input}`);
}

/**
 * Convert empty string input to undefined
 */
function emptyToUndefined(input: string | undefined): string | undefined {
  return input && input.trim() !== '' ? input : undefined;
}

/**
 * Validate deployment configuration mode
 */
function validateDeploymentMode(config: DeploymentConfig, useMergeCommitMode: boolean): void {
  const hasCommitMode = config.repository && config.commitSha;
  
  if (useMergeCommitMode && hasCommitMode) {
    throw new Error('Cannot use both commit_sha + repository and merge_commit_shas modes simultaneously');
  }
  
  if (!useMergeCommitMode && !hasCommitMode) {
    throw new Error('Must provide either (commit_sha + repository) or merge_commit_shas for deployment attribution');
  }

  // Integration branch mode is valid when used with commit mode
  // It's an enhancement to the single commit attribution mode
}

/**
 * Process inputs and create deployment configuration
 */
export function createDeploymentConfig(inputs: ActionInputs): DeploymentConfig {
  validateRequiredInputs(inputs);

  const repository = inputs.repository || process.env.GITHUB_REPOSITORY;
  const commitSha = inputs.commit_sha || process.env.GITHUB_SHA;
  
  const deployedAt = inputs.deployed_at 
    ? parseInt(inputs.deployed_at, 10) 
    : Math.floor(Date.now() / 1000);

  // Construct DX host URL from instance name
  const dxHost = `https://${inputs.dx_instance}.getdx.net`;

  // Parse optional inputs
  const metadata = parseJsonInput(inputs.metadata, 'metadata');
  const mergeCommitShas = parseJsonArrayInput(inputs.merge_commit_shas, 'merge_commit_shas');
  const success = parseBooleanInput(inputs.success);

  // Check if using merge commit mode
  const useMergeCommitMode = !!(mergeCommitShas && mergeCommitShas.length > 0);
  
  if (!useMergeCommitMode) {
    // For single commit mode, ensure repository and commitSha are provided
    if (!repository) {
      throw new Error('repository must be provided via input or GITHUB_REPOSITORY environment variable');
    }
    if (!commitSha) {
      throw new Error('commit_sha must be provided via input or GITHUB_SHA environment variable');
    }
  }

  const config: DeploymentConfig = {
    dxHost,
    bearer: inputs.bearer,
    service: inputs.service,
    deployedAt,
    repository: repository || '',  // Empty string for merge commit mode
    commitSha: commitSha || '',    // Empty string for merge commit mode
    referenceId: emptyToUndefined(inputs.reference_id),
    sourceUrl: emptyToUndefined(inputs.source_url),
    sourceName: emptyToUndefined(inputs.source_name),
    metadata,
    integrationBranch: emptyToUndefined(inputs.integration_branch),
    success,
    environment: emptyToUndefined(inputs.environment),
    mergeCommitShas,
  };

  // Validate deployment mode
  validateDeploymentMode(config, useMergeCommitMode);

  return config;
}