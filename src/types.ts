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
  repository?: string;
  /** Commit SHA for the deployment */
  commitSha?: string;
  /** Deployment timestamp (Unix timestamp) */
  deployedAt: number;
  /** Unique identifier for the deployment */
  referenceId?: string;
  /** External URL with more info about deployment */
  sourceUrl?: string;
  /** Source for the deployment (e.g., "argoCD") */
  sourceName?: string;
  /** JSON metadata with additional data */
  metadata?: Record<string, unknown>;
  /** Integration branch name */
  integrationBranch?: string;
  /** Whether the deployment was successful */
  success?: boolean;
  /** Environment name */
  environment?: string;
  /** Array of merge commit SHAs for attribution */
  mergeCommitShas?: string[];
}

/**
 * DX API deployment payload
 */
export interface DeploymentPayload {
  /** Service name for the deployment */
  service: string;
  /** Deployment timestamp (Unix timestamp) */
  deployed_at: number;
  /** Repository name in format "owner/repo" (required for commit_sha mode) */
  repository?: string;
  /** Commit SHA for the deployment (required for single commit mode) */
  commit_sha?: string;
  /** Array of merge commit SHAs for attribution (alternative to commit_sha + repository) */
  merge_commit_shas?: string[];
  /** Unique identifier for the deployment */
  reference_id?: string;
  /** External URL with more info about deployment */
  source_url?: string;
  /** Source for the deployment (e.g., "argoCD") */
  source_name?: string;
  /** JSON metadata with additional data */
  metadata?: Record<string, unknown>;
  /** Integration branch name */
  integration_branch?: string;
  /** Whether the deployment was successful */
  success?: boolean;
  /** Environment name */
  environment?: string;
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
  reference_id?: string;
  source_url?: string;
  source_name?: string;
  metadata?: string;
  integration_branch?: string;
  success?: string;
  environment?: string;
  merge_commit_shas?: string;
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