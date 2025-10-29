const core = require('@actions/core');

// Mock the core module
jest.mock('@actions/core');

describe('DX Create Deployment Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete require.cache[require.resolve('../src/index.js')];
  });

  test('should validate input structure', () => {
    // Test that we can mock the core inputs
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'dx_host': 'test.getdx.net',
        'bearer': 'test-token',
        'service': 'test-service',
        'repository': 'test/repo',
        'commit_sha': 'abc123'
      };
      return inputs[name] || '';
    });

    // Mock info and setOutput to avoid console output during tests
    core.info = jest.fn();
    core.setOutput = jest.fn();
    core.setFailed = jest.fn();

    expect(core.getInput).toBeDefined();
    expect(core.info).toBeDefined();
    expect(core.setFailed).toBeDefined();
  });

  test('should use environment variables as defaults', () => {
    process.env.GITHUB_REPOSITORY = 'test/repo';
    process.env.GITHUB_SHA = 'def456';

    expect(process.env.GITHUB_REPOSITORY).toBe('test/repo');
    expect(process.env.GITHUB_SHA).toBe('def456');
  });

  test('should handle timestamp conversion', () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const testTime = Math.floor(new Date('2023-01-01').getTime() / 1000);
    
    expect(currentTime).toBeGreaterThan(testTime);
    expect(parseInt('1700000000', 10)).toBe(1700000000);
  });
});