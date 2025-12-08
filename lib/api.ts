/**
 * Ghana Sign Language API Client
 * Connects to FastAPI backend on port 9000
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export interface SignMetadata {
  source: string;
  page: number;
  category: string;
  matched_word: string;
}

export interface SignSearchResult {
  word: string;
  sign_image: string;
  sign_id: number;
  confidence: number;
  metadata: SignMetadata;
}

export interface BrainStats {
  brain_exists: boolean;
  terms_file_exists: boolean;
  total_signs: number;
  total_images: number;
  brain_size_mb: number;
}

export interface HealthStatus {
  status: string;
  version: string;
  brain_loaded: boolean;
  total_signs: number;
}

/**
 * Search for a sign by English word
 */
export async function searchSign(query: string): Promise<SignSearchResult> {
  const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}

/**
 * Get brain statistics
 */
export async function getBrainStats(): Promise<BrainStats> {
  const response = await fetch(`${API_BASE_URL}/api/brain/stats`);

  if (!response.ok) {
    throw new Error('Failed to fetch brain stats');
  }

  return response.json();
}

/**
 * Check API health
 */
export async function getHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json();
}

/**
 * Get full URL for sign image
 */
export function getSignImageUrl(imagePath: string): string {
  // imagePath comes as /sign_images/sign_165_5_HELLO.jpeg
  return `${API_BASE_URL}${imagePath}`;
}

// ============================================
// CORRECTION API - Human-in-the-Loop Learning
// ============================================

export interface CorrectionFeedback {
  query: string;
  returned_word: string;
  is_correct: boolean;
  correct_word?: string;
  user_comment?: string;
  confidence_score: number;
}

export interface CorrectionResponse {
  success: boolean;
  feedback_id: number;
  message: string;
}

export interface AlternativeResult {
  rank: number;
  word: string;
  sign_image: string;
  confidence: number;
  page: number;
  category: string;
}

export interface AlternativesResponse {
  query: string;
  total_alternatives: number;
  alternatives: AlternativeResult[];
}

export interface CorrectionStats {
  total_feedback: number;
  incorrect_results: number;
  correct_results: number;
  pending_review: number;
  most_corrected_queries: Array<{
    query: string;
    count: number;
  }>;
}

/**
 * Flag a search result as correct or incorrect
 */
export async function flagResult(feedback: CorrectionFeedback): Promise<CorrectionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/corrections/flag`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }

  return response.json();
}

/**
 * Get alternative matches for a query
 */
export async function getAlternatives(query: string): Promise<AlternativesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/corrections/alternatives?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error('Failed to get alternatives');
  }

  return response.json();
}

/**
 * Get correction statistics
 */
export async function getCorrectionStats(): Promise<CorrectionStats> {
  const response = await fetch(`${API_BASE_URL}/api/corrections/stats`);

  if (!response.ok) {
    throw new Error('Failed to get correction stats');
  }

  return response.json();
}

// ============================================
// ADMIN API - Requires X-Admin-User-Id header
// ============================================

/**
 * Make an authenticated admin API request
 * Automatically adds X-Admin-User-Id header from user email
 *
 * @param endpoint - API endpoint (e.g., '/api/admin/contributions')
 * @param userEmail - Admin user's email address
 * @param options - Fetch options (method, body, etc.)
 */
export async function adminFetch(
  endpoint: string,
  userEmail: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('X-Admin-User-Id', userEmail);
  headers.set('Content-Type', 'application/json');

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * Admin API helper - GET request
 */
export async function adminGet<T>(endpoint: string, userEmail: string): Promise<T> {
  const response = await adminFetch(endpoint, userEmail, { method: 'GET' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Admin request failed');
  }

  return response.json();
}

/**
 * Admin API helper - POST request
 */
export async function adminPost<T>(endpoint: string, userEmail: string, body: unknown): Promise<T> {
  const response = await adminFetch(endpoint, userEmail, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Admin request failed');
  }

  return response.json();
}

/**
 * Admin API helper - PATCH request
 */
export async function adminPatch<T>(endpoint: string, userEmail: string, body: unknown): Promise<T> {
  const response = await adminFetch(endpoint, userEmail, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Admin request failed');
  }

  return response.json();
}

/**
 * Admin API helper - DELETE request
 */
export async function adminDelete<T>(endpoint: string, userEmail: string): Promise<T> {
  const response = await adminFetch(endpoint, userEmail, { method: 'DELETE' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Admin request failed');
  }

  return response.json();
}

// ============================================
// ADMIN API TYPES
// ============================================

export interface AdminOverview {
  total_contributions: number;
  total_words: number;
  total_users: number;
  pending_review: number;
  recent_contributions: Array<{
    id: number;
    word: string;
    user_id: string;
    quality_score: number;
    created_at: string;
  }>;
}

export interface AdminContribution {
  id: number;
  contribution_id: string;
  word: string;
  user_id: string;
  quality_score: number;
  is_hidden: boolean;
  flag_count: number;
  created_at: string;
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

/**
 * Get admin dashboard overview
 */
export async function getAdminOverview(userEmail: string): Promise<AdminOverview> {
  return adminGet('/api/admin/ama/overview', userEmail);
}

/**
 * Get all contributions (admin)
 */
export async function getAdminContributions(
  userEmail: string,
  params?: { page?: number; limit?: number; status?: string }
): Promise<{ contributions: AdminContribution[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return adminGet(`/api/admin/ama/contributions${query}`, userEmail);
}

/**
 * Delete a contribution (admin)
 */
export async function deleteContribution(userEmail: string, contributionId: number): Promise<void> {
  await adminDelete(`/api/admin/ama/contributions/${contributionId}`, userEmail);
}

/**
 * Hide a contribution (admin)
 */
export async function hideContribution(
  userEmail: string,
  contributionId: number,
  reason: string
): Promise<void> {
  await adminPatch(`/api/admin/ama/contributions/${contributionId}/hide`, userEmail, { reason });
}
