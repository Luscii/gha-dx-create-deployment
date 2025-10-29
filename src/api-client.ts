import * as https from 'https';
import { URL } from 'url';
import { DeploymentPayload, DeploymentResponse } from './types';

/**
 * DX API client for creating deployments
 */
export class DxApiClient {
  private readonly baseUrl: string;
  private readonly bearerToken: string;

  constructor(baseUrl: string, bearerToken: string) {
    this.baseUrl = baseUrl;
    this.bearerToken = bearerToken;
  }

  /**
   * Create a deployment in DX platform
   */
  async createDeployment(payload: DeploymentPayload): Promise<DeploymentResponse> {
    const url = `${this.baseUrl}/api/deployments.create`;
    return this.makeApiCall(url, payload);
  }

  /**
   * Make HTTPS API call to DX platform
   */
  private makeApiCall(url: string, payload: DeploymentPayload): Promise<DeploymentResponse> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const postData = JSON.stringify(payload);

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'gha-dx-create-deployment/1.0.0',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });

        res.on('end', () => {
          try {
            const response: DeploymentResponse = JSON.parse(data);

            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(`API request failed with status ${res.statusCode || 'unknown'}: ${data}`));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Response: ${data}`));
          }
        });
      });

      req.on('error', (error: Error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      // Write the payload
      req.write(postData);
      req.end();
    });
  }
}