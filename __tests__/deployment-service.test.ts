import * as core from '@actions/core';
import { DeploymentService } from '../src/deployment-service';
import { DeploymentConfig, DxSuccessResponse } from '../src/types';

// Mock the core module
jest.mock('@actions/core');
const mockedCore = core as jest.Mocked<typeof core>;

// Mock the API client
jest.mock('../src/api-client', () => ({
  DxApiClient: jest.fn().mockImplementation(() => ({
    createDeployment: jest.fn()
  }))
}));

describe('DeploymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConfig: DeploymentConfig = {
    dxHost: 'https://luscii.getdx.net',
    bearer: 'test-token',
    service: 'test-service',
    repository: 'test/repo',
    commitSha: 'abc123',
    deployedAt: 1700000000
  };

  describe('setActionOutputs', () => {
    it('should set correct outputs from response', () => {
      const service = new DeploymentService(mockConfig);
      const response: DxSuccessResponse = {
        ok: true,
        id: 'deployment-123',
        status: 'success'
      };

      service.setActionOutputs(response);

      expect(mockedCore.setOutput).toHaveBeenCalledWith('response', JSON.stringify(response));
      expect(mockedCore.setOutput).toHaveBeenCalledWith('deployment_id', 'deployment-123');
    });

    it('should set deployment_id as unknown when not available in response', () => {
      const service = new DeploymentService(mockConfig);
      const response: DxSuccessResponse = {
        ok: true,
        status: 'success'
      };

      service.setActionOutputs(response);

      expect(mockedCore.setOutput).toHaveBeenCalledWith('deployment_id', 'unknown');
    });
  });
});