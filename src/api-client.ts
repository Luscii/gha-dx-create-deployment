import * as https from 'https';
import { URL } from 'url';
import { DeploymentPayload, DeploymentResponse, DxApiError, DxErrorResponse, DxSuccessResponse } from './types';

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
  async createDeployment(payload: DeploymentPayload): Promise<DxSuccessResponse> {
    const url = `${this.baseUrl}/api/deployments.create`;
    return this.makeApiCall(url, payload);
  }

  /**
   * Make HTTPS API call to DX platform
   */
  private makeApiCall(url: string, payload: DeploymentPayload): Promise<DxSuccessResponse> {
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

        res.on('data', (chunk) => {
          data += chunk.toString();
        });

        res.on('end', () => {
          try {
            const response: DeploymentResponse = JSON.parse(data);

            // Always check the 'ok' parameter as required by the documentation
            if ('ok' in response) {
              if (response.ok === true) {
                // Successful response
                resolve(response as DxSuccessResponse);
              } else {
                // Error response with ok: false
                const errorResponse = response as DxErrorResponse;
                reject(new DxApiError(
                  errorResponse.error,
                  res.statusCode || 0,
                  this.getErrorMessage(errorResponse.error)
                ));
              }
            } else {
              // Response doesn't have 'ok' field - this is unexpected
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                // 2xx status without 'ok' field - treat as success but add the field
                resolve({ ok: true, ...response as Record<string, unknown> } as DxSuccessResponse);
              } else {
                // Non-2xx status without 'ok' field - treat as error
                reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
              }
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

  /**
   * Get human-readable error message for DX error codes
   * Handles both known and unknown error codes as per documentation
   */
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'not_authed':
        return 'This error occurs if the API request does not include a valid API key for authentication.';
      case 'invalid_auth':
        return 'The provided API key is invalid. This can happen if the key is expired or does not exist.';
      case 'account_inactive':
        return 'The user account associated with the API key is deactivated or suspended.';
      case 'invalid_json':
        return 'The JSON body of the request could not be parsed. This usually indicates a syntax error.';
      case 'required_params_missing':
        return 'One or more required parameters were not provided in the request.';
      case 'repo_not_found':
        return 'The specified repository could not be found. This could be due to a typo or an incorrect repository name.';
      default:
        return `Unexpected DX API error: ${errorCode}. This may indicate service issues or other unexpected factors affecting processing.`;
    }
  }
}