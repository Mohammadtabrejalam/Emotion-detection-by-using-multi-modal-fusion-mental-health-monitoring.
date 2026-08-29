import type { 
  ApiResponse, 
  AnalysisData, 
  DashboardData, 
  DailyCheckin, 
  ResearchData,
  User,
  LoginSession,
  DailyNote,
  Article
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('mindsense_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const getDevAuthHeaders = (): Record<string, string> => {
  const saved = localStorage.getItem('mindsense_dev_session');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.token) return { 'Authorization': `Bearer ${parsed.token}` };
    } catch {}
  }
  return {};
};

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

  async register(username: string, email: string, password: string, name: string): Promise<ApiResponse<{ user: User; token: string; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, name }),
      });
      const res = await response.json();
      if (res.success && res.data?.token) {
        localStorage.setItem('mindsense_token', res.data.token);
      }
      return res;
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
      const res = await response.json();
      if (res.success && res.data?.token) {
        localStorage.setItem('mindsense_token', res.data.token);
      }
      return res;
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async getLoginHistory(_userId?: number): Promise<ApiResponse<{ login_sessions: LoginSession[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login-history`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async updateProfile(userId: number, name: string, email: string): Promise<ApiResponse<{ user: User; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

  // ----------------- ARTICLES & COMMUNITY KNOWLEDGE HUB ----------------- //

  async getArticles(search?: string, category?: string): Promise<ApiResponse<{ articles: Article[] }>> {
    try {
      const params = new URLSearchParams();
      if (search && search.trim()) params.append('search', search.trim());
      if (category && category !== 'All') params.append('category', category);
      
      const response = await fetch(`${API_BASE_URL}/articles?${params.toString()}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async publishArticle(article: {
    user_id?: number | null;
    title: string;
    author: string;
    category: string;
    summary: string;
    content: string;
    tags: string[];
  }): Promise<ApiResponse<{ id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async likeArticle(articleId: number): Promise<ApiResponse<{ likes: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async deleteArticle(articleId: number, userId?: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const url = userId ? `${API_BASE_URL}/articles/${articleId}?user_id=${userId}` : `${API_BASE_URL}/articles/${articleId}`;
      const response = await fetch(url, {
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
        headers: getAuthHeaders(),
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

  async getHistory(_userId?: number): Promise<ApiResponse<{ history: AnalysisData[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async clearHistory(_userId?: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to reset history');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'DELETE_ERROR', message: error.message } };
    }
  },

  async getDashboard(_userId?: number): Promise<ApiResponse<DashboardData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: getAuthHeaders()
      });
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(checkin),
      });
      if (!response.ok) throw new Error('Failed to submit check-in');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'SUBMIT_ERROR', message: error.message } };
    }
  },

  async getCheckins(_userId?: number): Promise<ApiResponse<{ checkins: DailyCheckin[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/checkins`, {
        headers: getAuthHeaders()
      });
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

  // ----------------- SITE METRICS & VISITOR TRACKING ----------------- //

  async getStats(): Promise<ApiResponse<import('../types').SiteStats>> {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (!response.ok) throw new Error('Failed to fetch site statistics');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async recordVisit(page: string = window.location.pathname): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, user_agent: navigator.userAgent }),
      });
    } catch {
      // Non-blocking background analytics call
    }
  },

  async submitFeedback(payload: import('../types').FeedbackPayload): Promise<ApiResponse<{ id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'SUBMIT_ERROR', message: error.message } };
    }
  },

  async askAssistant(message: string, contextPage: string = 'home'): Promise<ApiResponse<import('../types').AssistantResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context_page: contextPage }),
      });
      if (!response.ok) throw new Error('Failed to communicate with research assistant');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'ASSISTANT_ERROR', message: error.message } };
    }
  },

  // ----------------- SECURE SHARE LINKS ----------------- //

  async createShareLink(resultId: string, expirationHours: number = 24, userId?: number): Promise<ApiResponse<{ share_token: string; share_url: string; expiration_hours: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/share/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ result_id: resultId, expiration_hours: expirationHours, user_id: userId }),
      });
      if (!response.ok) throw new Error('Failed to create share link');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'SHARE_ERROR', message: error.message } };
    }
  },

  async getSharedResult(token: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/share/${token}`);
      if (!response.ok) throw new Error('Failed to fetch shared analysis result');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async revokeShareLink(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/share/${token}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to revoke share link');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'REVOKE_ERROR', message: error.message } };
    }
  },

  async forgotPassword(username_or_email: string): Promise<ApiResponse<{ message: string; reset_token?: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async resetPassword(token: string, new_password: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {}
    localStorage.removeItem('mindsense_token');
  },

  // ----------------- RESEARCH PARTICIPATION APIS ----------------- //

  async getResearchStudies(): Promise<ApiResponse<{ studies: any[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/studies`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async submitResearchConsent(studyId: number, consentVersion: string = '1.0'): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ study_id: studyId, consent_version: consentVersion }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async submitResearchParticipation(payload: {
    study_id: number;
    age_group: string;
    gender_identity: string;
    questionnaire_answers: Record<string, any>;
    contributed_modalities: string;
    analysis_id?: string;
  }): Promise<ApiResponse<{ participant_code: string; contribution_id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async withdrawResearch(studyId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ study_id: studyId }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  // ----------------- EMOTION RECOGNITION CHALLENGE APIS ----------------- //

  async submitChallenge(score: number, totalQuestions: number, accuracy: number): Promise<ApiResponse<{ attempt_id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ score, total_questions: totalQuestions, accuracy }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async getChallengeHistory(): Promise<ApiResponse<{ history: any[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenge/history`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  // ----------------- USER DATA RIGHTS APIS ----------------- //

  async exportUserData(): Promise<ApiResponse<{ export: any }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/export-data`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async deleteUserAccount(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/account`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const res = await response.json();
      if (res.success) {
        localStorage.removeItem('mindsense_token');
      }
      return res;
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  // ----------------- DEVELOPER / ADMIN PORTAL APIS ----------------- //

  async developerRegister(payload: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    organization?: string;
    requested_role?: string;
  }): Promise<ApiResponse<{ message: string; verification_token: string; state: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async developerVerifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async developerLogin(usernameOrEmail: string, password: string): Promise<ApiResponse<{ developer: any; token: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'AUTH_ERROR', message: error.message } };
    }
  },

  async developerForgotPassword(username_or_email: string): Promise<ApiResponse<{ message: string; reset_token?: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async developerResetPassword(token: string, new_password: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: error.message } };
    }
  },

  async developerLogout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/developer/auth/logout`, {
        method: 'POST',
        headers: getDevAuthHeaders(),
      });
    } catch {}
    localStorage.removeItem('mindsense_dev_session');
  },

  async getDeveloperRequests(): Promise<ApiResponse<{ requests: any[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/requests`, {
        headers: getDevAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async updateDeveloperStatus(devId: number, status: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/requests/${devId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getDevAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'UPDATE_ERROR', message: error.message } };
    }
  },

  async getDeveloperDashboard(token?: string): Promise<ApiResponse<any>> {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : getDevAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/developer/dashboard`, { headers });
      if (!response.ok) throw new Error('Failed to fetch developer dashboard metrics');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async getDeveloperAnalytics(token?: string): Promise<ApiResponse<any>> {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : getDevAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/developer/analytics`, { headers });
      if (!response.ok) throw new Error('Failed to fetch developer analytics metrics');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async getDeveloperFeedback(status?: string, priority?: string): Promise<ApiResponse<{ feedback: any[] }>> {
    try {
      let url = `${API_BASE_URL}/developer/feedback`;
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, { headers: getDevAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch feedback list');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async updateDeveloperFeedback(feedbackId: number, status: string, priority?: string, internalNotes?: string, actorId?: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getDevAuthHeaders() },
        body: JSON.stringify({ status, priority, internal_notes: internalNotes, actor_id: actorId }),
      });
      if (!response.ok) throw new Error('Failed to update feedback status');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'UPDATE_ERROR', message: error.message } };
    }
  },

  async getDeveloperHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/health`, { headers: getDevAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch developer system health');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async getDeveloperAssistant(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/assistant`, { headers: getDevAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch assistant metrics');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async getDeveloperAuditLogs(): Promise<ApiResponse<{ logs: any[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/developer/audit-logs`, { headers: getDevAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } };
    }
  },

  async submitUserFeedback(category: string, content: string): Promise<ApiResponse<{ feedback_id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ category, content })
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: { code: 'SUBMIT_ERROR', message: error.message } };
    }
  },
};

