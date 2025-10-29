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
          'dx_host': 'test.getdx.net',
          'bearer': 'test-token',
          'service': 'test-service',
          'repository': 'test/repo',
          'commit_sha': 'abc123',
          'deployed_at': '1700000000'
        };
        return inputs[name] || '';
      });

      const inputs = getActionInputs();

      expect(inputs.dx_host).toBe('test.getdx.net');
      expect(inputs.bearer).toBe('test-token');
      expect(inputs.service).toBe('test-service');
      expect(inputs.repository).toBe('test/repo');
      expect(inputs.commit_sha).toBe('abc123');
      expect(inputs.deployed_at).toBe('1700000000');
    });
  });

  describe('validateRequiredInputs', () => {
    it('should throw error for missing dx_host', () => {
      const inputs: ActionInputs = {
        dx_host: '',
        bearer: 'test-token',
        service: 'test-service'
      };

      expect(() => validateRequiredInputs(inputs)).toThrow('dx_host input is required');
    });

    it('should throw error for missing bearer', () => {
      const inputs: ActionInputs = {
        dx_host: 'test.getdx.net',
        bearer: '',
        service: 'test-service'
      };

      expect(() => validateRequiredInputs(inputs)).toThrow('bearer input is required');
    });

    it('should throw error for missing service', () => {
      const inputs: ActionInputs = {
        dx_host: 'test.getdx.net',
        bearer: 'test-token',
        service: ''
      };

      expect(() => validateRequiredInputs(inputs)).toThrow('service input is required');
    });

    it('should pass validation with all required inputs', () => {
      const inputs: ActionInputs = {
        dx_host: 'test.getdx.net',
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
        dx_host: 'test.getdx.net',
        bearer: 'test-token',
        service: 'test-service'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.dxHost).toBe('https://test.getdx.net');
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
        dx_host: 'test.getdx.net',
        bearer: 'test-token',
        service: 'test-service',
        deployed_at: '1700000000'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.deployedAt).toBe(1700000000);
    });

    it('should add https:// prefix to dx_host if missing', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_host: 'test.getdx.net',
        bearer: 'test-token',
        service: 'test-service'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.dxHost).toBe('https://test.getdx.net');
    });

    it('should not modify dx_host if it already has protocol', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_host: 'https://test.getdx.net',
        bearer: 'test-token',
        service: 'test-service'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.dxHost).toBe('https://test.getdx.net');
    });
  });
});