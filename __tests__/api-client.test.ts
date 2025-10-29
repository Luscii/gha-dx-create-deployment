import { DxApiClient } from '../src/api-client';
import { DxApiError } from '../src/types';

// Mock the https module
jest.mock('https');

describe('DxApiClient', () => {
  let apiClient: DxApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient = new DxApiClient('https://luscii.getdx.net', 'test-token');
  });

  describe('Error handling', () => {
    it('should handle known DX error codes', () => {
      const errorCodes = [
        'not_authed',
        'invalid_auth', 
        'account_inactive',
        'invalid_json',
        'required_params_missing',
        'repo_not_found'
      ];

      errorCodes.forEach(errorCode => {
        try {
          throw new DxApiError(errorCode, 422);
        } catch (error) {
          expect(error).toBeInstanceOf(DxApiError);
          expect((error as DxApiError).errorCode).toBe(errorCode);
          expect((error as DxApiError).statusCode).toBe(422);
        }
      });
    });

    it('should handle unknown DX error codes', () => {
      const unknownErrorCode = 'service_temporarily_unavailable';
      
      try {
        throw new DxApiError(unknownErrorCode, 503, 'Unexpected DX API error: service_temporarily_unavailable. This may indicate service issues or other unexpected factors affecting processing.');
      } catch (error) {
        expect(error).toBeInstanceOf(DxApiError);
        expect((error as DxApiError).errorCode).toBe(unknownErrorCode);
        expect((error as DxApiError).statusCode).toBe(503);
        expect((error as DxApiError).message).toContain('Unexpected DX API error');
      }
    });
  });
});