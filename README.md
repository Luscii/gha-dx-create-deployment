# DX Create Deployment GitHub Action

A GitHub Action that creates deployment records in the DX platform by making API calls to your DX instance. This action provides full support for the DX [deployments.create API](https://docs.getdx.com/datacloudapi/methods/deployments.create/) with all available parameters and attribution modes.

## Usage

### Basic Usage (Single Commit Attribution)

```yaml
- name: Create DX Deployment
  uses: Luscii/gha-dx-create-deployment@v1
  with:
    dx_instance: 'luscii'  # for luscii.getdx.net
    bearer: ${{ secrets.DX_BEARER_TOKEN }}
    service: 'my-service-name'
    # Optional - these default to current repo and commit:
    # repository: ${{ github.repository }}
    # commit_sha: ${{ github.sha }}
```

### Advanced Usage with All Parameters

```yaml
- name: Create DX Deployment with Metadata
  uses: Luscii/gha-dx-create-deployment@v1
  with:
    dx_instance: 'luscii'
    bearer: ${{ secrets.DX_BEARER_TOKEN }}
    service: 'payments-service'
    environment: 'production'
    success: 'true'
    reference_id: ${{ github.run_id }}
    source_url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    source_name: 'GitHub Actions'
    metadata: '{"version": "${{ steps.get_version.outputs.version }}", "branch": "${{ github.ref_name }}"}'
    integration_branch: 'develop'
```

### Multiple Commits Attribution Mode

```yaml
- name: Create DX Deployment for Multiple Commits
  uses: Luscii/gha-dx-create-deployment@v1
  with:
    dx_instance: 'luscii'
    bearer: ${{ secrets.DX_BEARER_TOKEN }}
    service: 'web-frontend'
    merge_commit_shas: '["a0e61dfff93b2b07", "788cacf2c1cb3948", "ed4a39b2f1c8d9e7"]'
    environment: 'staging'
```

## Deployment Attribution Modes

DX supports several paths to attributing deployments to code changes. This action supports all of them:

### 1. Repository-Only Attribution
When only the `repository` is provided (or defaults), the deployment is attributed to all non-deployed pull requests in the specified repository with base refs equal to the default branch.

### 2. Single Commit Attribution (Default)
When `commit_sha` and `repository` are provided, the deployment is attributed to the matching pull request as well as all previous non-deployed pull requests with the same repository and base ref.

### 3. Integration Branch Attribution
When `commit_sha`, `repository`, and `integration_branch` are provided, the deployment is attributed only to pull requests merged into the integration branch.

### 4. Multiple Commits Attribution
When `merge_commit_shas` is provided, the deployment is attributed to the specific pull requests that correspond to the provided SHAs.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `dx_instance` | DX instance name (e.g., "luscii" for luscii.getdx.net) | Yes | - |
| `bearer` | Bearer token for authentication | Yes | - |
| `service` | Service name for the deployment | Yes | - |
| `repository` | Repository name in format "owner/repo" | No | `${{ github.repository }}` |
| `commit_sha` | Commit SHA for the deployment | No | `${{ github.sha }}` |
| `deployed_at` | Deployment timestamp (Unix timestamp) | No | Current time |
| `reference_id` | Unique identifier for the deployment | No | - |
| `source_url` | External URL with more info about deployment | No | - |
| `source_name` | Source for the deployment (e.g., "GitHub Actions") | No | - |
| `metadata` | JSON object with additional data | No | - |
| `integration_branch` | Integration branch name | No | - |
| `success` | Whether deployment was successful (true/false) | No | - |
| `environment` | Environment name | No | `"production"` |
| `merge_commit_shas` | JSON array of commit SHAs for multi-commit attribution | No | - |

## Outputs

| Output | Description |
|--------|-------------|
| `response` | Full JSON response from the DX API |
| `deployment_id` | The deployment ID returned by DX (if available) |

## Example Workflows

### Basic Deployment Recording

```yaml
name: Deploy and Record in DX

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy application
        run: |
          # Your deployment steps here
          echo "Deploying application..."
      
      - name: Record deployment in DX
        uses: Luscii/gha-dx-create-deployment@v1
        with:
          dx_instance: 'luscii'
          bearer: ${{ secrets.DX_BEARER_TOKEN }}
          service: 'my-web-service'
```

### Multi-Commit Attribution for Batch Deployments

```yaml
name: Batch Deploy Multiple Services

on:
  workflow_dispatch:
    inputs:
      commit_shas:
        description: 'JSON array of commit SHAs to deploy'
        required: true
        default: '["abc1234", "def5678"]'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy batch of commits
        run: |
          echo "Deploying commits: ${{ github.event.inputs.commit_shas }}"
          # Batch deployment logic here
      
      - name: Record batch deployment in DX
        uses: Luscii/gha-dx-create-deployment@v1
        with:
          dx_instance: 'luscii'
          bearer: ${{ secrets.DX_BEARER_TOKEN }}
          service: 'batch-processor'
          merge_commit_shas: ${{ github.event.inputs.commit_shas }}
          environment: 'production'
          success: 'true'
          source_name: 'Batch Deployment System'
```

## API Details

This action makes a POST request to `https://{dx_instance}.getdx.net/api/deployments.create` using the full [DX deployments.create API](https://docs.getdx.com/datacloudapi/methods/deployments.create/).

### Example API Payload (Single Commit Mode)

```json
{
  "service": "my_service",
  "repository": "orgname/repository", 
  "commit_sha": "abc1234",
  "deployed_at": 1700000000,
  "environment": "production",
  "success": true,
  "reference_id": "deploy-123",
  "source_url": "https://argocd.example.com/app/my-app",
  "source_name": "ArgoCD",
  "metadata": {
    "version": "1.2.3",
    "branch": "main"
  }
}
```

### Example API Payload (Multi-Commit Mode)

```json
{
  "service": "my_service",
  "merge_commit_shas": ["abc1234", "def5678"],
  "deployed_at": 1700000000,
  "environment": "staging",
  "success": true
}
```

The request includes:
- `Content-Type: application/json` header
- `Authorization: Bearer {token}` header
- `User-Agent: gha-dx-create-deployment/1.0.0` header

## Parameter Validation

The action includes comprehensive validation:

### Required Parameters
- `dx_instance`: Must be a non-empty string
- `bearer`: Must be a non-empty string  
- `service`: Must be a non-empty string

### Attribution Mode Validation
- **Single Commit Mode**: Requires `repository` and `commit_sha` (can use defaults)
- **Multi-Commit Mode**: Requires `merge_commit_shas` as a JSON array
- Cannot use both modes simultaneously

### JSON Parameter Validation
- `metadata`: Must be valid JSON object if provided
- `merge_commit_shas`: Must be valid JSON array of strings if provided

### Boolean Parameter Validation
- `success`: Must be "true" or "false" if provided (case-insensitive)

## Setup

1. Store your DX bearer token as a GitHub secret (e.g., `DX_BEARER_TOKEN`)
2. Use this action in your workflow after your deployment steps
3. Ensure your DX instance is accessible from GitHub Actions runners

## Error Handling

The action properly handles DX API responses by always checking the `ok` parameter in responses. It will fail if:
- Required inputs (`dx_instance`, `bearer`, `service`) are missing
- Attribution mode parameters are invalid or conflicting
- JSON parameters contain invalid JSON
- Boolean parameters contain invalid values
- The API request fails (network issues, authentication errors, etc.)
- The DX API returns an error response with `ok: false`

### Known DX API Errors

The action handles these expected DX API error codes:

| Error Code | Description |
|------------|-------------|
| `not_authed` | API request does not include a valid API key for authentication |
| `invalid_auth` | The provided API key is invalid, expired, or does not exist |
| `account_inactive` | The user account associated with the API key is deactivated or suspended |
| `invalid_json` | The JSON body of the request could not be parsed |
| `required_params_missing` | One or more required parameters were not provided in the request |
| `repo_not_found` | The specified repository could not be found |

**Note**: Other errors can be returned if the service is down or other unexpected factors affect processing. The action is designed to handle any error code returned by the API.

Error details will be logged to help with troubleshooting.

## API Documentation

For complete API documentation, see the official [DX deployments.create API documentation](https://docs.getdx.com/datacloudapi/methods/deployments.create/).
