import { DeploymentPayload, DxSuccessResponse } from '../src/types';

export class DxApiClient {
  constructor(private baseUrl: string, private bearerToken: string) {
    // Mock constructor
  }

  async createDeployment(payload: DeploymentPayload): Promise<DxSuccessResponse> {
    console.log('Mock API Client called with payload:', JSON.stringify(payload, null, 2));
    
    return {
      ok: true,
      data: {
        id: 'mock-deployment-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...payload
      }
    };
  }
}
