const core = require('@actions/core');
const https = require('https');
const { URL } = require('url');

/**
 * Main function to execute the DX deployment creation
 */
async function run() {
  try {
    // Get inputs
    const dxHost = core.getInput('dx_host', { required: true });
    const bearer = core.getInput('bearer', { required: true });
    const service = core.getInput('service', { required: true });
    const repository = core.getInput('repository') || process.env.GITHUB_REPOSITORY;
    const commitSha = core.getInput('commit_sha') || process.env.GITHUB_SHA;
    const deployedAtInput = core.getInput('deployed_at');

    // Validate required inputs
    if (!dxHost) {
      throw new Error('dx_host input is required');
    }
    if (!bearer) {
      throw new Error('bearer input is required');
    }
    if (!service) {
      throw new Error('service input is required');
    }

    // Prepare deployed_at timestamp
    const deployedAt = deployedAtInput ? parseInt(deployedAtInput, 10) : Math.floor(Date.now() / 1000);

    // Ensure dx_host has the correct format
    const apiUrl = dxHost.startsWith('http') ? dxHost : `https://${dxHost}`;
    const fullUrl = `${apiUrl}/api/deployments.create`;

    // Prepare the payload
    const payload = {
      repository: repository,
      service: service,
      commit_sha: commitSha,
      deployed_at: deployedAt
    };

    core.info(`Creating deployment for service: ${service}`);
    core.info(`Repository: ${repository}`);
    core.info(`Commit SHA: ${commitSha}`);
    core.info(`Deployed at: ${deployedAt}`);

    // Make the API call
    const response = await makeApiCall(fullUrl, bearer, payload);

    core.info('Deployment created successfully');
    core.setOutput('response', JSON.stringify(response));
    core.setOutput('deployment_id', response.id || 'unknown');

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

/**
 * Make HTTPS API call to DX platform
 * @param {string} url - The API endpoint URL
 * @param {string} bearer - Bearer token for authentication
 * @param {object} payload - JSON payload to send
 * @returns {Promise<object>} - Response from the API
 */
function makeApiCall(url, bearer, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearer}`,
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'gha-dx-create-deployment/1.0.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse API response: ${parseError.message}. Response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    // Write the payload
    req.write(postData);
    req.end();
  });
}

// Run the action
run();