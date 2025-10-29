import * as core from '@actions/core';
import { getActionInputs, validateRequiredInputs, createDeploymentConfig } from '../src/inputs';
import { ActionInputs } from '../src/types';

// Mock the core module
jest.mock('@actions/core');
const mockedCore = core as jest.Mocked<typeof core>;

describe('Input processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_SHA;
  });

  describe('getActionInputs', () => {
    it('should get all inputs from core', () => {
      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'dx_instance': 'luscii',
          'bearer': 'test-token',
          'service': 'test-service',
          'repository': 'test/repo',
          'commit_sha': 'abc123',
          'deployed_at': '1700000000'
        };
        return inputs[name] || '';
      });

      const inputs = getActionInputs();

      expect(inputs.dx_instance).toBe('luscii');
      expect(inputs.bearer).toBe('test-token');
      expect(inputs.service).toBe('test-service');
      expect(inputs.repository).toBe('test/repo');
      expect(inputs.commit_sha).toBe('abc123');
      expect(inputs.deployed_at).toBe('1700000000');
    });
  });

  describe('validateRequiredInputs', () => {
    it('should throw error for missing dx_instance', () => {
      const inputs: ActionInputs = {
        dx_instance: '',
        bearer: 'test-token',
        service: 'test-service'
      };

      expect(() => validateRequiredInputs(inputs)).toThrow('dx_instance input is required');
    });

    it('should throw error for missing bearer', () => {
      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: '',
        service: 'test-service'
      };

      expect(() => validateRequiredInputs(inputs)).toThrow('bearer input is required');
    });

    it('should throw error for missing service', () => {
      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: ''
      };

      expect(() => validateRequiredInputs(inputs)).toThrow('service input is required');
    });

    it('should pass validation with all required inputs', () => {
      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service'
      };

      expect(() => validateRequiredInputs(inputs)).not.toThrow();
    });
  });

  describe('createDeploymentConfig', () => {
    it('should create config with environment variables as defaults', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.dxHost).toBe('https://luscii.getdx.net');
      expect(config.bearer).toBe('test-token');
      expect(config.service).toBe('test-service');
      expect(config.repository).toBe('test/repo');
      expect(config.commitSha).toBe('def456');
      expect(config.deployedAt).toBeGreaterThan(0);
    });

    it('should use custom deployed_at when provided', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service',
        deployed_at: '1700000000'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.deployedAt).toBe(1700000000);
    });

    it('should construct DX host URL from instance name', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.dxHost).toBe('https://luscii.getdx.net');
    });

    it('should work with different instance names', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'mycompany',
        bearer: 'test-token',
        service: 'test-service'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.dxHost).toBe('https://mycompany.getdx.net');
    });
  });
});