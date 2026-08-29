import type { 
  ApiResponse, 
  AnalysisData, 
  DashboardData, 
  DailyCheckin, 
  ResearchData,
  User,
  LoginSession,
  DailyNote
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export const apiService = {
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.success;
    } catch {
      return false;
    }
  },

  // ----------------- AUTHENTICATION ----------------- //

  async register(username: string, email: string, password: string, name: string): Promise<ApiResponse<{ user: User; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, name }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async login(username_or_email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email, password }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async getLoginHistory(userId: number): Promise<ApiResponse<{ login_sessions: LoginSession[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login-history?user_id=${userId}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async updateProfile(userId: number, name: string, email: string): Promise<ApiResponse<{ user: User; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, name, email }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, old_password: oldPassword, new_password: newPassword }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async getDatasetSamples(): Promise<ApiResponse<{ samples: any[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/samples`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  // ----------------- DAILY NOTES / JOURNAL ----------------- //

  async saveDailyNote(userId: number, date: string, title: string, content: string, moodTag: string): Promise<ApiResponse<{ id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, date, title, content, mood_tag: moodTag }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async getDailyNotes(userId: number): Promise<ApiResponse<{ notes: DailyNote[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/notes?user_id=${userId}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async deleteDailyNote(noteId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}?user_id=${userId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  // ----------------- ANALYSIS & LOGS ----------------- //

  async analyzeEmotion(
    text: string | null,
    audioFile: File | null,
    imageFile: File | null,
    demoMode: boolean,
    userId?: number
  ): Promise<ApiResponse<AnalysisData>> {
    const formData = new FormData();
    
    if (text && text.trim()) {
      formData.append('text', text.trim());
    }
    if (audioFile) {
      formData.append('audio', audioFile);
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }
    formData.append('demo_mode', String(demoMode));
    if (userId) {
      formData.append('user_id', String(userId));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Failed to connect to the backend server.',
        },
      };
    }
  },

  async getHistory(userId?: number): Promise<ApiResponse<{ history: AnalysisData[] }>> {
    try {
      const url = userId ? `${API_BASE_URL}/history?user_id=${userId}` : `${API_BASE_URL}/history`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch history');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async clearHistory(userId?: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const url = userId ? `${API_BASE_URL}/history?user_id=${userId}` : `${API_BASE_URL}/history`;
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to reset history');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'DELETE_ERROR', message: error.message } };
    }
  },

  async getDashboard(userId?: number): Promise<ApiResponse<DashboardData>> {
    try {
      const url = userId ? `${API_BASE_URL}/dashboard?user_id=${userId}` : `${API_BASE_URL}/dashboard`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async submitCheckin(checkin: Omit<DailyCheckin, 'timestamp'>): Promise<ApiResponse<{ id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkin),
      });
      if (!response.ok) throw new Error('Failed to submit check-in');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'SUBMIT_ERROR', message: error.message } };
    }
  },

  async getCheckins(userId?: number): Promise<ApiResponse<{ checkins: DailyCheckin[] }>> {
    try {
      const url = userId ? `${API_BASE_URL}/checkins?user_id=${userId}` : `${API_BASE_URL}/checkins`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch check-ins history');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async getResearch(): Promise<ApiResponse<ResearchData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/research`);
      if (!response.ok) throw new Error('Failed to fetch research metrics');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },
};
