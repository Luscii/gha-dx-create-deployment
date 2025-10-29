import * as core from '@actions/core';
import { ActionInputs, DeploymentConfig } from './types';

/**
 * Get and validate action inputs
 */
export function getActionInputs(): ActionInputs {
  return {
    dx_host: core.getInput('dx_host', { required: true }),
    bearer: core.getInput('bearer', { required: true }),
    service: core.getInput('service', { required: true }),
    repository: core.getInput('repository'),
    commit_sha: core.getInput('commit_sha'),
    deployed_at: core.getInput('deployed_at'),
  };
}

/**
 * Validate required inputs and throw an error if any are missing
 */
export function validateRequiredInputs(inputs: ActionInputs): void {
  if (!inputs.dx_host) {
    throw new Error('dx_host input is required');
  }
  if (!inputs.bearer) {
    throw new Error('bearer input is required');
  }
  if (!inputs.service) {
    throw new Error('service input is required');
  }
}

/**
 * Process inputs and create deployment configuration
 */
export function createDeploymentConfig(inputs: ActionInputs): DeploymentConfig {
  validateRequiredInputs(inputs);

  const repository = inputs.repository || process.env.GITHUB_REPOSITORY;
  const commitSha = inputs.commit_sha || process.env.GITHUB_SHA;
  
  if (!repository) {
    throw new Error('repository must be provided via input or GITHUB_REPOSITORY environment variable');
  }
  
  if (!commitSha) {
    throw new Error('commit_sha must be provided via input or GITHUB_SHA environment variable');
  }

  const deployedAt = inputs.deployed_at 
    ? parseInt(inputs.deployed_at, 10) 
    : Math.floor(Date.now() / 1000);

  // Ensure dx_host has the correct format
  const dxHost = inputs.dx_host.startsWith('http') 
    ? inputs.dx_host 
    : `https://${inputs.dx_host}`;

  return {
    dxHost,
    bearer: inputs.bearer,
    service: inputs.service,
    repository,
    commitSha,
    deployedAt,
  };
}