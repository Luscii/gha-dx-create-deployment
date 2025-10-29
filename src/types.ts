/**
 * Configuration for DX deployment creation
 */
export interface DeploymentConfig {
  /** DX instance host (e.g., yourinstance.getdx.net) */
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
 * Response from DX API
 */
export interface DeploymentResponse {
  /** Deployment ID (if available) */
  id?: string;
  /** Additional response properties */
  [key: string]: unknown;
}

/**
 * Action inputs from GitHub Actions
 */
export interface ActionInputs {
  dx_host: string;
  bearer: string;
  service: string;
  repository?: string;
  commit_sha?: string;
  deployed_at?: string;
}