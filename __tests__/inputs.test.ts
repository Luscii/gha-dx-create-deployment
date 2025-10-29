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
          'deployed_at': '1700000000',
          'reference_id': 'deploy-123',
          'source_url': 'https://example.com',
          'source_name': 'GitHub Actions',
          'metadata': '{"version": "1.0.0"}',
          'integration_branch': 'develop',
          'success': 'true',
          'environment': 'staging',
          'merge_commit_shas': '["abc123", "def456"]'
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
      expect(inputs.reference_id).toBe('deploy-123');
      expect(inputs.source_url).toBe('https://example.com');
      expect(inputs.source_name).toBe('GitHub Actions');
      expect(inputs.metadata).toBe('{"version": "1.0.0"}');
      expect(inputs.integration_branch).toBe('develop');
      expect(inputs.success).toBe('true');
      expect(inputs.environment).toBe('staging');
      expect(inputs.merge_commit_shas).toBe('["abc123", "def456"]');
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
    it('should create config with environment variables as defaults for commit mode', () => {
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

    it('should work with merge_commit_shas mode', () => {
      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service',
        merge_commit_shas: '["abc123", "def456"]'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.mergeCommitShas).toEqual(['abc123', 'def456']);
      expect(config.repository).toBeUndefined();
      expect(config.commitSha).toBeUndefined();
    });

    it('should parse optional parameters correctly', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service',
        reference_id: 'deploy-123',
        source_url: 'https://example.com/deploy/123',
        source_name: 'GitHub Actions',
        metadata: '{"version": "1.2.3", "branch": "main"}',
        integration_branch: 'develop',
        success: 'true',
        environment: 'staging'
      };

      const config = createDeploymentConfig(inputs);

      expect(config.referenceId).toBe('deploy-123');
      expect(config.sourceUrl).toBe('https://example.com/deploy/123');
      expect(config.sourceName).toBe('GitHub Actions');
      expect(config.metadata).toEqual({ version: '1.2.3', branch: 'main' });
      expect(config.integrationBranch).toBe('develop');
      expect(config.success).toBe(true);
      expect(config.environment).toBe('staging');
    });

    it('should handle empty optional parameters', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service',
        reference_id: '',
        metadata: '',
        success: ''
      };

      const config = createDeploymentConfig(inputs);

      expect(config.referenceId).toBeUndefined();
      expect(config.metadata).toBeUndefined();
      expect(config.success).toBeUndefined();
    });

    it('should throw error for invalid JSON metadata', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service',
        metadata: 'invalid json'
      };

      expect(() => createDeploymentConfig(inputs)).toThrow('Invalid JSON in metadata');
    });

    it('should throw error for invalid merge_commit_shas JSON', () => {
      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service',
        merge_commit_shas: '["abc123", 123]'
      };

      expect(() => createDeploymentConfig(inputs)).toThrow('merge_commit_shas must contain only strings');
    });

    it('should throw error for invalid boolean success value', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service',
        success: 'maybe'
      };

      expect(() => createDeploymentConfig(inputs)).toThrow('Boolean input must be "true" or "false"');
    });

    it('should throw error when both commit mode and merge commit mode are provided', () => {
      process.env.GITHUB_REPOSITORY = 'test/repo';
      process.env.GITHUB_SHA = 'def456';

      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service',
        merge_commit_shas: '["abc123"]'
      };

      expect(() => createDeploymentConfig(inputs)).toThrow('Cannot use both commit_sha + repository and merge_commit_shas modes simultaneously');
    });

    it('should throw error when neither mode is provided', () => {
      const inputs: ActionInputs = {
        dx_instance: 'luscii',
        bearer: 'test-token',
        service: 'test-service'
      };

      expect(() => createDeploymentConfig(inputs)).toThrow('Must provide either (commit_sha + repository) or merge_commit_shas for deployment attribution');
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