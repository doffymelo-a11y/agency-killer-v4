// ═══════════════════════════════════════════════════════════════
// API Client - Super Admin Backoffice
// Wrapper for backend API calls with automatic JWT Bearer auth
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase';
import type { ApiResponse } from '../types';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3457';

// ─────────────────────────────────────────────────────────────────
// API Client Class
// ─────────────────────────────────────────────────────────────────

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get current JWT token from Supabase session
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Make authenticated request to backend API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get JWT token
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Build headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      // Make request
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Parse response
      const data = await response.json();

      // Check if response is successful
      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            message: 'Request failed',
            code: 'REQUEST_ERROR',
          },
        };
      }

      return data;
    } catch (error: any) {
      console.error('[API] Request failed:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;

    // Add query parameters
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// Export singleton instance
// ─────────────────────────────────────────────────────────────────

export const api = new ApiClient(BACKEND_API_URL);

// ─────────────────────────────────────────────────────────────────
// Convenience exports
// ─────────────────────────────────────────────────────────────────

export { BACKEND_API_URL };
