# DX Create Deployment GitHub Action

A GitHub Action that creates deployment records in the DX platform by making API calls to your DX instance.

## Usage

```yaml
- name: Create DX Deployment
  uses: Luscii/gha-dx-create-deployment@v1
  with:
    dx_host: 'yourinstance.getdx.net'
    bearer: ${{ secrets.DX_BEARER_TOKEN }}
    service: 'my-service-name'
    # Optional inputs (with defaults):
    # repository: ${{ github.repository }}  # defaults to current repo
    # commit_sha: ${{ github.sha }}         # defaults to current commit
    # deployed_at: ''                       # defaults to current timestamp
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `dx_host` | DX instance host (e.g., yourinstance.getdx.net) | Yes | - |
| `bearer` | Bearer token for authentication | Yes | - |
| `service` | Service name for the deployment | Yes | - |
| `repository` | Repository name in format "owner/repo" | No | `${{ github.repository }}` |
| `commit_sha` | Commit SHA for the deployment | No | `${{ github.sha }}` |
| `deployed_at` | Deployment timestamp (Unix timestamp) | No | Current time |

## Outputs

| Output | Description |
|--------|-------------|
| `response` | Full JSON response from the DX API |
| `deployment_id` | The deployment ID returned by DX (if available) |

## Example Workflow

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
          dx_host: 'yourinstance.getdx.net'
          bearer: ${{ secrets.DX_BEARER_TOKEN }}
          service: 'my-web-service'
```

## API Details

This action makes a POST request to `https://{dx_host}/api/deployments.create` with the following payload:

```json
{
  "repository": "orgname/repository",
  "service": "my_service", 
  "commit_sha": "abc1234",
  "deployed_at": 1700000000
}
```

The request includes:
- `Content-Type: application/json` header
- `Authorization: Bearer {token}` header

## Setup

1. Store your DX bearer token as a GitHub secret (e.g., `DX_BEARER_TOKEN`)
2. Use this action in your workflow after your deployment steps
3. Ensure your DX instance is accessible from GitHub Actions runners

## Error Handling

The action will fail if:
- Required inputs (`dx_host`, `bearer`, `service`) are missing
- The API request fails (network issues, authentication errors, etc.)
- The DX API returns an error response

Error details will be logged to help with troubleshooting.
