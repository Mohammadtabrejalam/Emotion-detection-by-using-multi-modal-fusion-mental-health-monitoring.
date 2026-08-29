export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  created_at?: string;
}

export interface LoginSession {
  id: number;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  status: string;
}

export interface DailyNote {
  id: number;
  user_id: number;
  date: string;
  title: string;
  content: string;
  mood_tag: string;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  user_id?: number | null;
  title: string;
  author: string;
  category: string;
  read_time: string;
  summary: string;
  content: string;
  tags: string[];
  likes: number;
  created_at: string;
}

export interface PipelineStage {
  stage: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ModalityPrediction {
  emotion: string;
  confidence: number;
}

export interface ModalityPredictions {
  text?: ModalityPrediction | null;
  audio?: ModalityPrediction | null;
  image?: ModalityPrediction | null;
}

export interface AnalysisData {
  id: string;
  timestamp: string;
  emotion: string;
  confidence: number;
  confidence_label: string;
  probabilities: Record<string, number>;
  modalities_used: string[];
  modality_predictions: ModalityPredictions;
  is_demo: boolean;
  model_version: string;
  disclaimer: string;
  crisis_alert: boolean;
  wellness_insight: string;
  stages?: PipelineStage[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export interface DailyCheckin {
  id?: number;
  user_id?: number;
  timestamp: string;
  feeling_score: number;
  energy_score: number;
  sleep_score: number;
  stress_score: number;
  talk_to_someone: number | boolean;
  notes?: string;
}

export interface DashboardSummary {
  total_analyses: number;
  emotion_distribution: Record<string, number>;
  latest_analysis: AnalysisData | null;
  modality_usage: {
    text: number;
    audio: number;
    image: number;
  };
  checkin_trends: DailyCheckin[];
  historic_trends: {
    timestamp: string;
    final_emotion: string;
    confidence_score: number;
  }[];
  notes_count?: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  trends: {
    dominant_emotion: string;
    emotional_variability: string;
    recent_trend: string;
    wellness_score?: number;
    alert: boolean;
  };
}

export interface ResearchMetric {
  model_type: string;
  accuracy: number;
  f1_score: number;
}

export interface ResearchData {
  metrics: ResearchMetric[];
  confusion_matrix: number[][];
  labels: string[];
  dataset_info: {
    name: string;
    train_samples: number;
    test_samples: number;
    classes: number;
  };
}

export interface SiteStats {
  total_visits: number;
  total_analyses: number;
  total_checkins: number;
  total_articles: number;
  registered_users: number;
  is_real_data: boolean;
}

export interface FeedbackPayload {
  rating: number;
  category: string;
  comment?: string;
  user_id?: number;
}

export interface AssistantResponse {
  response: string;
  topic?: string;
  is_crisis?: boolean;
  suggested_actions?: string[];
}

