import { apiClient } from '../client';
import type {
  ProStoreApplication,
  ReviewProStoreApplicationData,
} from '../types/proStore';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface GetApplicationsParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** Get all pro store applications (admin only) */
export async function getProStoreApplications(
  params?: GetApplicationsParams
): Promise<PaginatedResponse<ProStoreApplication>> {
  return apiClient.get<PaginatedResponse<ProStoreApplication>>(
    '/api/admin/pro-store/applications',
    { params: params as Record<string, string | number | boolean | undefined> }
  );
}

/** Get a single pro store application by ID (admin only) */
export async function getProStoreApplication(
  id: string
): Promise<ProStoreApplication> {
  return apiClient.get<ProStoreApplication>(
    `/api/admin/pro-store/applications/${id}`
  );
}

/** Review (approve/reject/request info) a pro store application (admin only) */
export async function reviewProStoreApplication(
  id: string,
  data: ReviewProStoreApplicationData
): Promise<ProStoreApplication> {
  return apiClient.post<ProStoreApplication>(
    `/api/admin/pro-store/applications/${id}/review`,
    data
  );
}
