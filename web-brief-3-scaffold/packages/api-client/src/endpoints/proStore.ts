import { apiClient } from '../client';
import type {
  ProStoreApplication,
  SubmitProStoreApplicationData,
} from '../types/proStore';

/** Submit a pro store application for the current user */
export async function submitProStoreApplication(
  data: SubmitProStoreApplicationData
): Promise<ProStoreApplication> {
  return apiClient.post<ProStoreApplication>(
    '/api/pro-store/applications',
    data
  );
}

/** Get the current user's application status */
export async function getApplicationStatus(): Promise<ProStoreApplication | null> {
  return apiClient.get<ProStoreApplication | null>(
    '/api/pro-store/applications/me'
  );
}
