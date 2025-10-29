import { run } from '../src/main';
import { DxApiClient } from '../src/api-client';
import * as core from '@actions/core';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Mock @actions/core
jest.mock('@actions/core');

// Mock the DxApiClient
jest.mock('../src/api-client');

describe('Local Action Test', () => {
  let mockCreateDeployment: jest.Mock;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original process.env
    originalEnv = { ...process.env };

    // Clear and load test environment
    dotenv.config({ path: path.join(__dirname, '../.env.test') });

    // Reset all mocks
    jest.resetAllMocks();

    // Setup @actions/core mock
    (core.getInput as jest.Mock).mockImplementation((name: string, options?: { required?: boolean }) => {
      const envVarName = `INPUT_${name.toUpperCase()}`;
      const value = process.env[envVarName];
      if (options?.required && !value) {
        throw new Error(`Input required and not supplied: ${name}`);
      }
      return value || '';
    });

    // Setup DxApiClient mock
    mockCreateDeployment = jest.fn();
    (DxApiClient as jest.Mock).mockImplementation(() => ({
      createDeployment: mockCreateDeployment
    }));

    // Setup default successful response
    mockCreateDeployment.mockResolvedValue({
      ok: true,
      data: {
        id: 'mock-deployment-id',
        created_at: '2025-10-29T10:00:00Z',
        updated_at: '2025-10-29T10:00:00Z',
        service: process.env.INPUT_SERVICE,
        repository: process.env.INPUT_REPOSITORY,
        commit_sha: process.env.INPUT_COMMIT_SHA,
        deployed_at: process.env.INPUT_DEPLOYED_AT,
        reference_id: process.env.INPUT_REFERENCE_ID,
        source_url: process.env.INPUT_SOURCE_URL,
        environment: process.env.INPUT_ENVIRONMENT || 'production',
        success: process.env.INPUT_SUCCESS === 'true',
        metadata: process.env.INPUT_METADATA ? JSON.parse(process.env.INPUT_METADATA) : undefined
      }
    });
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  it('should run successfully with all required inputs', async () => {
    await run();
    expect(DxApiClient).toHaveBeenCalledWith(
      'https://mock-instance.getdx.net',
      process.env.INPUT_BEARER
    );
    expect(mockCreateDeployment).toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should run successfully with minimal inputs', async () => {
    // Clear optional inputs
    delete process.env.INPUT_REPOSITORY;
    delete process.env.INPUT_COMMIT_SHA;
    delete process.env.INPUT_DEPLOYED_AT;
    delete process.env.INPUT_REFERENCE_ID;
    delete process.env.INPUT_SOURCE_URL;
    delete process.env.INPUT_ENVIRONMENT;
    delete process.env.INPUT_SUCCESS;
    delete process.env.INPUT_METADATA;

    await run();
    expect(DxApiClient).toHaveBeenCalled();
    expect(mockCreateDeployment).toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should fail when required inputs are missing', async () => {
    // Remove required input
    delete process.env.INPUT_DX_INSTANCE;

    await run();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Input required and not supplied: dx_instance')
    );
  });

  it('should handle API errors gracefully', async () => {
    // Simulate API error
    mockCreateDeployment.mockRejectedValue(new Error('API Error'));

    await run();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Action failed: API Error')
    );
  });

  it('should handle invalid JSON metadata', async () => {
    // Set invalid JSON metadata
    process.env.INPUT_METADATA = '{invalid:json}';

    await run();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Action failed:')
    );
  });

  it('should set outputs on successful deployment', async () => {
    const mockResponse = {
      ok: true,
      data: {
        id: 'test-deployment-id',
        service: 'test-service'
      }
    };
    mockCreateDeployment.mockResolvedValue(mockResponse);

    await run();
    expect(core.setOutput).toHaveBeenCalledWith('response', JSON.stringify(mockResponse));
    expect(core.setOutput).toHaveBeenCalledWith('deployment_id', 'test-deployment-id');
  });
});
