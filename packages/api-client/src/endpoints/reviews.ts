import { apiClient } from '../client';

export interface ReviewData {
  id: string;
  rating: number;
  review_text: string | null;
  review_type: string;
  created_at: string;
  reviewer: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  listing: {
    id: string;
    title: string;
    image: string | null;
  } | null;
}

export interface ReviewsResponse {
  reviews: ReviewData[];
  total: number;
  hasMore: boolean;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_counts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/** GET /api/reviews/user/:userId — paginated reviews for a user */
export function getUserReviews(
  userId: string,
  params?: { limit?: number; offset?: number }
) {
  return apiClient.get<ReviewsResponse>(`/api/reviews/user/${userId}`, {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** GET /api/reviews/user/:userId/stats — review statistics */
export function getUserReviewStats(userId: string) {
  return apiClient.get<ReviewStats>(`/api/reviews/user/${userId}/stats`);
}
