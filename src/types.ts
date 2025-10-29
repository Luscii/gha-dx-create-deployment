/**
 * Configuration for DX deployment creation
 */
export interface DeploymentConfig {
  /** DX instance URL (e.g., https://luscii.getdx.net) */
  dxHost: string;
  /** Bearer token for authentication */
  bearer: string;
  /** Service name for the deployment */
  service: string;
  /** Repository name in format "owner/repo" */
  repository: string;
  /** Commit SHA for the deployment */
  commitSha: string;
  /** Deployment timestamp (Unix timestamp) */
  deployedAt: number;
}

/**
 * DX API deployment payload
 */
export interface DeploymentPayload {
  /** Repository name in format "owner/repo" */
  repository: string;
  /** Service name for the deployment */
  service: string;
  /** Commit SHA for the deployment */
  commit_sha: string;
  /** Deployment timestamp (Unix timestamp) */
  deployed_at: number;
}

/**
 * Response from DX API (union type)
 */
export type DeploymentResponse = DxSuccessResponse | DxErrorResponse;

/**
 * Custom error class for DX API errors
 */
export class DxApiError extends Error {
  constructor(
    public readonly errorCode: DxErrorCode,
    public readonly statusCode: number,
    message?: string
  ) {
    super(message || `DX API error: ${errorCode}`);
    this.name = 'DxApiError';
  }
}

/**
 * Action inputs from GitHub Actions
 */
export interface ActionInputs {
  dx_instance: string;
  bearer: string;
  service: string;
  repository?: string;
  commit_sha?: string;
  deployed_at?: string;
}

/**
 * DX API error codes (known errors, but other errors are possible)
 */
export type DxErrorCode = 
  | 'not_authed'
  | 'invalid_auth'
  | 'account_inactive'
  | 'invalid_json'
  | 'required_params_missing'
  | 'repo_not_found'
  | string; // Allow for other unexpected errors

/**
 * DX API error response
 */
export interface DxErrorResponse {
  ok: false;
  error: DxErrorCode;
}

/**
 * DX API success response
 */
export interface DxSuccessResponse {
  ok: true;
  [key: string]: unknown;
}